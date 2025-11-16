import UserModel from "../models/userModel.js";
import FormData from "form-data";
import axios from "axios";

export const generateImage = async (req, res) => {
  try {
    const { userId, prompt } = req.body;

    const user = await UserModel.findById(userId);

    if (!user || !prompt) {
      return res.json({ success: false, message: "Missing Details" });
    }

    if (user.credits === 0 || user.credits < 0) {
      return res.json({
        success: false,
        message: "No credit balance",
        credits: user.credits,
      });
    }

    const formData = new FormData();
    formData.append("prompt", prompt); // ✅ fixed (you used = instead of ())

    // ✅ sanitize API key to remove hidden newline/space characters
    const cleanApiKey = process.env.CLIPDROP_API.replace(/(\r\n|\n|\r|\s)/gm, "");
    console.log("✅ Using CLIPDROP_API:", JSON.stringify(cleanApiKey));

    const { data } = await axios.post(
      "https://clipdrop-api.co/text-to-image/v1",
      formData,
      {
        headers: {
          ...formData.getHeaders(), // ✅ include FormData headers
          "x-api-key": cleanApiKey, // ✅ fully cleaned key
        },
        responseType: "arraybuffer",
      }
    );

    const base64Image = Buffer.from(data, "binary").toString("base64");
    const resultImage = `data:image/png;base64,${base64Image}`;

    await UserModel.findByIdAndUpdate(user._id, {
      credits: user.credits - 1,
    });

    res.json({
      success: true,
      message: "Image Generated",
      credits: user.credits - 1,
      resultImage,
    });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};
