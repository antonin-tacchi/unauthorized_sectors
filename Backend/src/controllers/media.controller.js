import ProjectMedia from "../models/ProjectMedia.js";

export async function getProjectMedia(req, res) {
  try {
    const { projectId } = req.query;
    if (!projectId) return res.status(400).json({ message: "projectId required" });
    const media = await ProjectMedia.find({ projectId })
      .sort({ sortOrder: 1, createdAt: 1 })
      .lean();
    return res.json(media);
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
}

export async function createMedia(req, res) {
  try {
    const item = await ProjectMedia.create(req.body);
    return res.status(201).json(item);
  } catch (e) {
    return res.status(400).json({ message: e.message });
  }
}

export async function updateMedia(req, res) {
  try {
    const item = await ProjectMedia.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).lean();
    if (!item) return res.status(404).json({ message: "Not found" });
    return res.json(item);
  } catch (e) {
    return res.status(400).json({ message: e.message });
  }
}

export async function deleteMedia(req, res) {
  try {
    await ProjectMedia.findByIdAndDelete(req.params.id);
    return res.json({ message: "Deleted" });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
}
