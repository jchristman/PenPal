import PenPal from "#penpal/core";
import { parseMasscan, performMasscan } from "../../api.js";

export default {
  async parseMasscanFile(root, args, context) {
    let res = {
      status: "Error Uploading Data",
      was_success: false,
      affected_records: [],
    };
    if (args.submissionDoc.format !== "JSON") {
      res.status = "Please Submit JSON Data";
      return res;
    }
    let jsonData = Buffer.from(args.submissionDoc.base64_content, "base64");
    res = await parseMasscan(args.submissionDoc.project_id, jsonData);
    return res;
  },

  async performMasscan(root, { data: args }, context) {
    await performMasscan(args);
    response.status = "Masscan Started";
    response.was_success = true;
    return response;
  },
};
