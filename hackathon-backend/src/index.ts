import * as csv from 'csvtojson';
import * as fs from 'fs/promises';
import { backOff } from "exponential-backoff";
import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
  apiKey: "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",
});
const openai = new OpenAIApi(configuration);

const csvFilePath = './test.csv';
const outputFilePath = './file.json';
const getOpenAIResponse = async (b) => {
  const openAiResponse =  await openai.createChatCompletion({
          messages: [
            {
              role: "user",
              content: `Can generate an elaborative collective key theme from the website links,descriptions and titles present in ${b} in a bulleted points and subpoints?`,
            },
            {
              role: "user",
              content: "Elaborate more on the key themes and subthemes fetched above in a bulleted points and subpoints?",
            },
            {
              role: "user",
              content: "Can you generate an elaborative article of around 1000 words from the key themes fetched above in an md format without any plagiarism and also please add some links and resources in the article for better understanding?"
            },
          ],
          model: 'gpt-3.5-turbo'
        });
  console.log(openAiResponse.data.choices[0]);
  //export the response in an md file
    await fs.writeFile('./output.md', openAiResponse.data.choices[0].message.content);
}
async function readCsvAndWriteToJson() {
  try {
    const jsonObj = await csv().fromFile(csvFilePath);
    const columns = Object.keys(jsonObj[0]);
    const columnData = jsonObj.map((row) => {
      const obj = {};
      obj.website = row.Website;
      obj.description = row.Description;
      obj.page_title = row['Page Title'];
      return obj;
    });
    console.log(columnData)
    const jsonData = { data: columnData };
    console.log(JSON.stringify(jsonData.data))
    // await fs.writeFile(outputFilePath, JSON.stringify(jsonData));
    // console.log(`JSON data written to ${outputFilePath}`);
    const result = backOff(() => getOpenAIResponse(JSON.stringify(jsonData.data)));

  } catch (err) {
    console.error(err);
  }
}

readCsvAndWriteToJson();
