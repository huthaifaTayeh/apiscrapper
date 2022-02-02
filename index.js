const PORT = 8000;

const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const fastcsv = require("fast-csv");
let currentDate = new Date();
const fs = require("fs");
const ws = fs.createWriteStream("data.csv");

const fetchURL = "https://zeenazaki.com/shop";

const app = express();
const images = [];
const prodsNames = [];
const prices = [];
const jsonData = [];

async function getPages() {
	console.log("inside getPages");
	let numberOfPages;
	await axios
		.get(fetchURL)
		.then((resp) => {
			const html = resp.data;
			const $ = cheerio.load(html);
			numberOfPages = $(".page-numbers").children("li").last().text();
			console.log("number of pages is: ", numberOfPages);
		})
		.catch((error) => {
			console.log(error);
		});
	return numberOfPages;
}

async function getProducts() {
	console.log("inside function beggining");
	try {
		console.log("before getPages");
		const pages = await getPages();
		console.log("after getPages");
		for (let page = 1; page <= pages; page++) {
			console.log("inside for loop in getProducts");
			const { data } = await axios.get(fetchURL + `/page/${page}`);
			const $ = cheerio.load(data);
			$(".box-name a").each(function () {
				const title = $(this).text();
				prodsNames.push(title);
			});
			$(".preview-thumb img").each(function () {
				const url = $(this).attr("src");
				images.push(url);
			});
			$(".woocommerce-Price-amount bdi").each(function () {
				const url = $(this).text();
				prices.push(url);
			});
		}
		for (let prod = 0; prod < prodsNames.length; prod++) {
			jsonData.push({
				prodName: prodsNames[prod],
				imageUrl: images[prod],
				price: prices[prod],
			});
		}
		fastcsv
			.write(jsonData, { headers: true })
			.on("finish", function () {
				console.log("Write to CSV successfully!");
			})
			.pipe(ws);
	} catch (error) {
		console.log(error);
	}
}

app.get("/images", (req, res) => {
	console.log("before calling get products function");
	getProducts();
	console.log("After");
});

app.listen(PORT, () => console.log("server is running on port: ", PORT));

// axios
// .get("https://zeenazaki.com/shop")
// .then((response) => {
//     const html = response.data;
//     const $ = cheerio.load(html);

//     pagesNum = $(".page-numbers").children("li").last().text();
//     console.log(pagesNum);
//     $(".box-name a").each(function () {
//         const title = $(this).text();
//         prodsNames.push(title);
//     });
//     $(".preview-thumb img").each(function () {
//         const url = $(this).attr("src");
//         images.push(url);
//     });
//     $(".woocommerce-Price-amount bdi").each(function () {
//         const url = $(this).text();
//         prices.push(url);
//     });
//     res.json(prices);
//     for (let prod = 0; prod < prodsNames.length; prod++) {
//         jsonData.push({
//             prodName: prodsNames[prod],
//             imageUrl: images[prod],
//             price: prices[prod],
//         });
//     }
//     fastcsv
//         .write(jsonData, { headers: true })
//         .on("finish", function () {
//             console.log("Write to CSV successfully!");
//         })
//         .pipe(ws);
// })
// .catch((err) => console.log(err));
