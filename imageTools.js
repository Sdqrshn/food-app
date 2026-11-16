import { ImageManipulator, SaveFormat } from "expo-image-manipulator";

export async function shrink(asset, maxSide = 1200, compress = 0.7) {
  try {
    const resize =
      asset.width >= asset.height
        ? { width: Math.min(asset.width, maxSide) }
        : { height: Math.min(asset.height, maxSide) };
    const context = ImageManipulator.manipulate(asset.uri);
    context.resize(resize);
    const image = await context.renderAsync();
    const result = await image.saveAsync({ format: SaveFormat.JPEG, compress });
    return { uri: result.uri, mimeType: "image/jpeg" };
  } catch {
    return asset;
  }
}