import FilterConfig from "../models/FilterConfig.js";
import Project from "../models/Project.js";

const DEFAULTS = {
  mappingTypes: ["mlo","interior","exterior","ymap","ytyp","custom-props","addon-map","rework"],
  styles:       ["modern","classic","cyber"],
  sizes:        ["small","medium","massive"],
  performances: ["optimized","balanced","heavy"],
};

async function getOrCreate() {
  let doc = await FilterConfig.findOne();
  if (!doc) doc = await FilterConfig.create(DEFAULTS);
  return doc;
}

export async function getFilters(req, res) {
  try {
    const doc = await getOrCreate();
    return res.json(doc);
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
}

export async function updateFilters(req, res) {
  try {
    const { mappingTypes, styles, sizes, performances } = req.body;
    const doc = await getOrCreate();
    if (mappingTypes) doc.mappingTypes = mappingTypes;
    if (styles)       doc.styles       = styles;
    if (sizes)        doc.sizes        = sizes;
    if (performances) doc.performances = performances;
    await doc.save();
    return res.json(doc);
  } catch (e) {
    return res.status(400).json({ message: e.message });
  }
}

export async function getTags(req, res) {
  try {
    const tags = await Project.aggregate([
      { $unwind: "$tags" },
      { $group: { _id: "$tags", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    return res.json(tags.map(({ _id, count }) => ({ tag: _id, count })));
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
}

export async function deleteTag(req, res) {
  try {
    const { tag } = req.params;
    await Project.updateMany({ tags: tag }, { $pull: { tags: tag } });
    return res.json({ message: `Tag "${tag}" removed from all projects` });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
}
