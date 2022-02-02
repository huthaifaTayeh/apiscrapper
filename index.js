const PORT = 8000;

const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const fastcsv = require("fast-csv");
const fs = require("fs");
const ws = fs.createWriteStream("data.csv");

const app = express();
const images = [];
const prodsNames = [];
const jsonData = [];
app.get("/images", (req, res) => {
	axios
		.get("https://zeenazaki.com/shop")
		.then((response) => {
			const html = response.data;
			console.log(html);
			const $ = cheerio.load(html);
			$(".box-name a").each(function () {
				const title = $(this).text();
				prodsNames.push(title);
			});
			$(".preview-thumb img").each(function () {
				const url = $(this).attr("src");
				console.log($(this));
				images.push(url);
			});
			res.json(prodsNames);
			for (let prod = 0; prod < prodsNames.length; prod++) {
				jsonData.push({ prodName: prodsNames[prod], imageUrl: images[prod] });
			}
			fastcsv
				.write(jsonData, { headers: true })
				.on("finish", function () {
					console.log("Write to CSV successfully!");
				})
				.pipe(ws);
		})
		.catch((err) => console.log(err));
});

app.listen(PORT, () => console.log("server is running on port: ", PORT));
