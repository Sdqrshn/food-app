import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../AuthContext";
import { shrink } from "../imageTools";

export default function usePhotoActions() {
  const { changePhoto, removePhoto } = useAuth();
  const [sheet, setSheet] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function pick(fromCamera) {
    setSheet(false);
    await new Promise((resolve) => setTimeout(resolve, 300));
    setError("");
    const options = { allowsEditing: true, aspect: [1, 1], quality: 0.8 };
    let result;
    if (fromCamera) {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) return setError("Camera permission is needed");
      result = await ImagePicker.launchCameraAsync(options);
    } else {
      result = await ImagePicker.launchImageLibraryAsync({ ...options, mediaTypes: ["images"] });
    }
    if (result.canceled) return;
    setBusy(true);
    const small = await shrink(result.assets[0], 512);
    const done = await changePhoto(small);
    setBusy(false);
    if (!done.ok) setError("Could not update your photo. Try again.");
  }

  async function confirmRemove() {
    setRemoving(false);
    setBusy(true);
    const done = await removePhoto();
    setBusy(false);
    if (!done.ok) setError("Could not remove your photo. Try again.");
  }

  return { sheet, setSheet, removing, setRemoving, busy, error, pick, confirmRemove };
}