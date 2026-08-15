import ExpoModulesCore
import Vision
import UIKit

public class SubjectOutlineModule: Module {
  public func definition() -> ModuleDefinition {
    Name("SubjectOutline")

    AsyncFunction("generateOutline") { (sourceUri: String, outputUri: String, lineColor: String, lineWidth: Double) -> [String: String] in
      do {
        guard let cgImage = try Self.loadImage(from: sourceUri) else {
          return Self.makeResult(outputUri: "", type: "fallback", error: "无法加载图片")
        }

        // 1) 优先：人像分割 → 沿人物蒙版描边（主体剪影）
        if let mask = Self.personMask(from: cgImage),
           let path = Self.contourPath(fromMask: mask, imageSize: cgImage.size) {
          let saved = try Self.renderStencil(path: path, size: cgImage.size, colorHex: lineColor, lineWidth: lineWidth, outputUri: outputUri)
          return Self.makeResult(outputUri: saved, type: "person", error: "")
        }

        // 2) 回退：整图轮廓检测（线稿式）
        if let path = Self.contourPath(fromImage: cgImage) {
          let saved = try Self.renderStencil(path: path, size: cgImage.size, colorHex: lineColor, lineWidth: lineWidth, outputUri: outputUri)
          return Self.makeResult(outputUri: saved, type: "contour", error: "")
        }

        return Self.makeResult(outputUri: "", type: "fallback", error: "未检测到主体轮廓")
      } catch {
        return Self.makeResult(outputUri: "", type: "fallback", error: error.localizedDescription)
      }
    }
  }

  private static func makeResult(outputUri: String, type: String, error: String) -> [String: String] {
    ["outputUri": outputUri, "type": type, "error": error]
  }

  private static func loadImage(from sourceUri: String) throws -> CGImage? {
    let path: String
    if sourceUri.hasPrefix("file://"), let url = URL(string: sourceUri) {
      path = url.path
    } else {
      path = sourceUri
    }
    guard let image = UIImage(contentsOfFile: path) else { return nil }
    return image.cgImage
  }

  /// 人像分割：返回人物蒙版（灰度 CGImage），无人像时为 nil
  private static func personMask(from image: CGImage) -> CGImage? {
    let request = VNGeneratePersonSegmentationRequest()
    request.qualityLevel = .balanced
    let handler = VNImageRequestHandler(cgImage: image, options: [:])
    do {
      try handler.perform([request])
    } catch {
      return nil
    }
    guard let observation = request.results?.first else { return nil }
    let ciImage = CIImage(cvPixelBuffer: observation.pixelBuffer)
    guard let mask = CIContext(options: nil).createCGImage(ciImage, from: ciImage.extent) else { return nil }
    return mask
  }

  /// 沿人像蒙版描边
  private static func contourPath(fromMask mask: CGImage, imageSize: CGSize) -> CGPath? {
    let scaled = resize(mask, to: imageSize)
    let request = VNDetectContoursRequest()
    request.contrastAdjustment = 1.0
    request.detectsDarkOnLight = false
    let handler = VNImageRequestHandler(cgImage: scaled, options: [:])
    do {
      try handler.perform([request])
    } catch {
      return nil
    }
    guard let observation = request.results?.first,
          let top = observation.topLevelContours.first else { return nil }
    let path = CGMutablePath()
    add(contour: top, to: path, width: imageSize.width, height: imageSize.height)
    return path
  }

  /// 回退：整图轮廓检测
  private static func contourPath(fromImage image: CGImage) -> CGPath? {
    let request = VNDetectContoursRequest()
    request.contrastAdjustment = 1.5
    request.detectsDarkOnLight = true
    let handler = VNImageRequestHandler(cgImage: image, options: [:])
    do {
      try handler.perform([request])
    } catch {
      return nil
    }
    guard let observation = request.results?.first else { return nil }
    let path = CGMutablePath()
    for contour in observation.topLevelContours {
      add(contour: contour, to: path, width: CGFloat(image.width), height: CGFloat(image.height))
    }
    return path
  }

  /// 把 Vision 的归一化轮廓点（原点在左下）转换为 UIKit 坐标（原点在左上）并写入 path
  private static func add(contour: VNContour, to path: CGMutablePath, width: CGFloat, height: CGFloat) {
    let points = contour.normalizedPoints
    guard points.count > 1 else { return }
    let first = CGPoint(x: points[0].x * width, y: (1 - points[0].y) * height)
    path.move(to: first)
    for point in points.dropFirst() {
      path.addLine(to: CGPoint(x: point.x * width, y: (1 - point.y) * height))
    }
    path.closeSubpath()
    for child in contour.childContours {
      add(contour: child, to: path, width: width, height: height)
    }
  }

  private static func resize(_ image: CGImage, to size: CGSize) -> CGImage {
    let ci = CIImage(cgImage: image)
    guard ci.extent.width > 0, ci.extent.height > 0 else { return image }
    let scaleX = size.width / ci.extent.width
    let scaleY = size.height / ci.extent.height
    let scaled = ci.transformed(by: CGAffineTransform(scaleX: scaleX, y: scaleY))
    return CIContext(options: nil).createCGImage(scaled, from: CGRect(origin: .zero, size: size)) ?? image
  }

  /// 把轮廓路径画到透明背景 PNG 并写入 outputUri
  private static func renderStencil(path: CGPath, size: CGSize, colorHex: String, lineWidth: Double, outputUri: String) throws -> String {
    let renderer = UIGraphicsImageRenderer(size: size)
    let stroke = color(fromHex: colorHex) ?? UIColor.white
    let pixelWidth = max(1.0, min(size.width, size.height) * CGFloat(lineWidth) * 0.005)
    let pngData = renderer.pngData { _ in
      stroke.setStroke()
      let bezier = UIBezierPath(cgPath: path)
      bezier.lineWidth = pixelWidth
      bezier.lineJoinStyle = .round
      bezier.lineCapStyle = .round
      bezier.stroke()
    }

    let outputPath: String
    if outputUri.hasPrefix("file://"), let url = URL(string: outputUri) {
      outputPath = url.path
    } else {
      outputPath = outputUri
    }
    try pngData.write(to: URL(fileURLWithPath: outputPath))
    return URL(fileURLWithPath: outputPath).absoluteString
  }

  private static func color(fromHex hex: String) -> UIColor? {
    var value = hex.trimmingCharacters(in: .whitespacesAndNewlines)
    if value.hasPrefix("#") { value.removeFirst() }
    guard value.count == 6, let intValue = UInt64(value, radix: 16) else { return nil }
    let red = CGFloat((intValue >> 16) & 0xff) / 255.0
    let green = CGFloat((intValue >> 8) & 0xff) / 255.0
    let blue = CGFloat(intValue & 0xff) / 255.0
    return UIColor(red: red, green: green, blue: blue, alpha: 1.0)
  }
}

private extension CGImage {
  var size: CGSize {
    CGSize(width: width, height: height)
  }
}
