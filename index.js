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
	let numberOfPages;
	await axios
		.get(fetchURL)
		.then((resp) => {
			const html = resp.data;
			const $ = cheerio.load(html);
			numberOfPages = $(".page-numbers").children("li").last().text();
		})
		.catch((error) => {
			console.log(error);
		});
	return numberOfPages;
}

async function getProductPage(href) {
	imagesList = [];
	try {
		const { data } = await axios.get(`https://zeenazaki.com/product/${href}`);
		const $ = cheerio.load(data);
		console.log("inside the fetch prod main image function");
		const url = $(".woocommerce-product-gallery a").attr("href");
		imagesList.push(url);
		console.log("image url in product page", url);

		// $(".prettyPhoto img").each(function () {
		// 	const url = $(this).attr("src");
		// 	console.log("image url in product page", url);
		// 	imagesList.push(url);
		// });
	} catch (error) {
		console.log(error);
	}
	return imagesList;
}

async function getProducts() {
	try {
		const pages = await getPages();
		for (let page = 1; page <= pages; page++) {
			const { data } = await axios.get(fetchURL + `/page/${page}`);
			const $ = cheerio.load(data);
			$(".box-name a").each(async function () {
				const title = $(this).text();
				const href = $(this).attr("href").split("/").slice(-2)[0];
				const imgs = await getProductPage(href);
				images.push(imgs);

				prodsNames.push(title);
			});
			// $(".preview-thumb img").each(function () {
			// 	const url = $(this).attr("src");
			// 	images.push(url);
			// });
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
	getProducts();
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
