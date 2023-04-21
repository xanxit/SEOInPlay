import { Configuration, OpenAIApi } from "openai";
import axios from "axios";
import * as cheerio from "cheerio";
import * as csv from "fast-csv";
import * as fs from "fs";
import * as xml2js from "xml2js";
import { backOff } from "exponential-backoff";

const sitemapUrl = "https://www.alation.com/post-sitemap.xml";
const configuration = new Configuration({
  apiKey: "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",
});
const openai = new OpenAIApi(configuration);
const MAX_RETRIES = 10;
const RETRY_DELAY = 3000;

async function scrapeSitemap() {
  try {
    const response = await axios.get(sitemapUrl);
    const result = await xml2js.parseStringPromise(response.data);
    const urls = result.urlset.url.map((url) => {
      return url.loc[0];
    });

    const csvStream = csv.format({ headers: true });
    const writeStream = fs.createWriteStream("sitemap.csv");
    csvStream.pipe(writeStream);

    for (const url of urls) {
      try {
        const response = await axios.get(url);
        if (response.status !== 404) {
          const $ = cheerio.load(response.data);
          const title = $("title").text().trim();
          const description = $('meta[name="description"]')
            .attr("content")
            .trim();

          csvStream.write({ url, title, description });
        } else {
          continue;
        }
      } catch (error) {
        console.log(error);
      }
    }

    csvStream.end(() => {
      console.log("CSV file successfully created.");
    });
  } catch (error) {
    console.log(error);
  }
}
const csvFilePath = "./sitemap.csv";
const outputFilePath = "./file.json";
const getOpenAIResponse = async (json) => {
  let filename = json.url.split("/blog/").pop();
  if (filename.endsWith("/"))
  {
    filename = filename.slice(0, -1);
  }
  const b = JSON.stringify(json);
  let retries = 0;
  while (retries < MAX_RETRIES) {
    try {
    const openAiResponse = await openai.createChatCompletion({
      messages: [
        {
          role: "user",
          content: `Can generate an elaborative collective key theme using these details ${b} in a bulleted points and subpoints?`,
        },
        {
          role: "user",
          content:
            "Elaborate more on the key themes and subthemes fetched above in a bulleted points and subpoints?",
        },
        {
          role: "user",
          content:
            "Can you generate an elaborative article of around 1200 words from the key themes fetched above in an md format without any plagiarism?",
        },
      ],
      model: "gpt-3.5-turbo",
    });
    console.log(openAiResponse.data.choices[0]);
    const res = openAiResponse.data.choices[0].message?.content;
    //export the response in an md file
    await fs.writeFile(`./${filename}.md`, res, (res,err) => {
      console.log("file created:",filename+".md")
      if (err)
        console.log(err);
    });
  }
  catch (error) {
    if (error.response && error.response.status === 429) {
      console.log(`Rate limited. Retrying in ${RETRY_DELAY}ms...`);

      retries++;
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    } else {
      throw error;
    }
  }
  }
};
const main = async () => {
  try {
    // await scrapeSitemap();
    const stream = fs.createReadStream(csvFilePath);
    const jsonObj = await new Promise((resolve) => {
      const data = [];
      csv
        .parseStream(stream, { headers: true })
        .on("data", (row) => data.push(row))
        .on("end", () => resolve(data));
    });
    const columns = Object.keys(jsonObj[0]);
    const columnData = jsonObj.map((row) => {
      const obj = {};
      columns.forEach((col) => {
        obj[col] = row[col];
      });
      return obj;
    });
    const jsonData = { data: columnData };
    const regex =
      /\bhttps?:\/\/(?:\w+\.)+\w+(?:\/\S*)?(?:active-metadata|data-governance|data-catalog|lineage|discovery)\S*/;
    const matchingUrls = jsonData.data.filter((url) => regex.test(url.url));
    const arr: Object[][] = [];
    for (let i = 0; i < 10; i += 10) {
      arr.push(matchingUrls.slice(i, i + 10));
    }
    console.log(">>>>",arr);
    const ans = [];
    await Promise.all(
      arr.map(
        (x, i) =>
          new Promise(async (resolve, reject) => {
            console.log("calling batch ", i / 10);
            const batch = x;
            const promises = batch.map((b) =>
              backOff(() => getOpenAIResponse(b))
            );
            const res = await Promise.all(promises);
            ans.push(res);
            console.log(">>>>",ans, ans.length)
            resolve(true);
          })
      )
    );
    // const result = backOff(() => getOpenAIResponse(arr));
    // await fs.writeFile(outputFilePath, JSON.stringify(jsonData),(err)=>{
    //   if(err){
    //     console.log(err)
    //   }
    // });
    // console.log(`JSON data written to ${outputFilePath}`);
  } catch (err) {
    console.error(err);
  }
};
main();
// scrapeSitemap();
