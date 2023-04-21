import { Configuration, OpenAIApi } from "openai";
import * as xml2js from "xml2js";
import axios from "axios";
import { min } from "lodash";
import { backOff } from "exponential-backoff";
import * as fs from "fs";

const url: string = "https://www.collibra.com/blog-sitemap.xml";
const configuration = new Configuration({
  apiKey: "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",
});
const openai = new OpenAIApi(configuration);

const findAllUrlsFromSiteMap = async () => {
  try {
    const res = await axios.get(url);
    const responseString = res.data;
    const responseJson = await xml2js.parseStringPromise(responseString);
    const ans = responseJson.urlset.url.map((url) => url.loc[0]);
    console.log(ans);
    return ans;
  } catch (e) {
    console.error("error finding all urls from sitemap ", e);
  }
};
const getOpenAIResponse = async (b) => {
  const filename = b.split('/').pop();
  const openAiResponse =  await openai.createChatCompletion({
          messages: [
            {
              role: "user",
              content: `Can generate an elaborative collective key theme in ${b} in a bulleted points and subpoints?`,
            },
            {
              role: "user",
              content: "Elaborate more on the key themes and subthemes fetched above in a bulleted points and subpoints?",
            },
            {
              role: "user",
              content: "Can you generate an elaborative article of around 1200 words from the key themes fetched above in an md format without any plagiarism?"
            },
          ],
          model: 'gpt-3.5-turbo'
        });
  console.log(openAiResponse.data.choices[0]);
  const res = openAiResponse.data.choices[0].message?.content;
  //export the response in an md file
    await fs.writeFile(`./${filename}.md`, res,(err)=>{
      console.log(err)
    });
}
const main = async () => {
  const urls: string[] = await findAllUrlsFromSiteMap();
  const regex =
    /\bhttps?:\/\/(?:\w+\.)+\w+(?:\/\S*)?(?:active-metadata|data-governance|data-catalog|lineage|discovery)\S*/;
  const matchingUrls = urls.filter((url) => regex.test(url));
  // console.log(matchingUrls);
  const arr: string[][] = [];
  for (let i = 0; i < matchingUrls.length-80; i += 10) {
        arr.push(matchingUrls.slice(i, min([i + 10, matchingUrls.length])));
      }
      const ans = [];
      await Promise.all(arr.map((x,i)=>new Promise(async(resolve, reject)=>{
            console.log("calling batch ", i / 10);
            const batch = x;
            const promises = batch.map((b) => backOff(() => getOpenAIResponse(b)));
            const res = await Promise.all(promises);
            ans.push(res);
            resolve(true);
          })))
        
};
main();