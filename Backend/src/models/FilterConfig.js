import mongoose from "mongoose";

// Single document (singleton) storing allowed filter values
const filterConfigSchema = new mongoose.Schema({
  mappingTypes: [String],
  styles:       [String],
  sizes:        [String],
  performances: [String],
});

export default mongoose.model("FilterConfig", filterConfigSchema);
