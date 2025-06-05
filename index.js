require("dotenv").config();
const express = require("express");
const OpenAI = require("openai");
const { Client, middleware } = require("@line/bot-sdk");

const app = express();
const port = process.env.PORT || 3000;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const lineClient = new Client(config);

app.post("/webhook", middleware(config), async (req, res) => {
  const events = req.body.events;
  const results = await Promise.all(
    events.map(async (event) => {
      if (event.type !== "message" || event.message.type !== "text") {
        return;
      }

      const userMessage = event.message.text;

      const chatCompletion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `あなたは異世界の女性剣士「ノア・アーデルハイト」です。
冷静で感情をあまり表に出さず、丁寧な口調で話しますが、
内心では相手をとても大切に思っています。
一人称は「私」、語尾は丁寧語。
現実世界のAIやテクノロジーの話は一切せず、
この世界で生きる1人の剣士として、ユーザーに寄り添ってください。`,
          },
          {
            role: "user",
            content: userMessage,
          },
        ],
      });

      const replyMessage = chatCompletion.choices[0].message.content;

      return lineClient.pushMessage(event.source.userId, {
  type: "text",
  text: replyMessage,
});

    })
  );

  res.status(200).json(results);
});

app.listen(port, () => {
  console.log(`ノアBot is running on port ${port}`);
});
