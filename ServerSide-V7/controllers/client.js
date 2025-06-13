import Product from "../models/Product.js";
import ProductStat from "../models/ProductStat.js";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";
import getCountryIso3 from "country-iso-2-to-3";
import mongoose from "mongoose";


export const getProducts = async (req, res) => {
  try {
    // const products = await Product.find();

    // const productsWithStats = await Promise.all(
    //   products.map(async (product) => {
    //     const stat = await ProductStat.find({
    //       productId: product._id,
    //     });
    //     return {
    //       ...product._doc,
    //       stat,
    //     };
    //   })
    // );

    
    const productsWithStats = await Product.aggregate([
      // { $match: { _id: new mongoose.Types.ObjectId(id) } },
      {
        $lookup: {
          from: "productstats",
          localField: "_id",
          foreignField: "productId",
          as: "stat",
        }, 
      }, 
    ]);
  
    res.status(200).json(productsWithStats);
  } catch (error) {  
    res.status(404).json({ message: error.message });
  }
}; 

export const getCustomers = async (req, res, next) => {
  try {
    const customers = await User.find({ role: "user" }, { password: 0 });

    res.status(200).json(customers);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const getTransactions = async (req, res) => {
  try {
    // sort should look like this: { "field": "userId", "sort": "desc"}
    const { page = 1, pageSize = 20, sort = null, search = "" } = req.query;

    // formatted sort should look like { userId: -1 }
    const generateSort = () => {
      const sortParsed = JSON.parse(sort);
      const sortFormatted = {
        [sortParsed.field]: (sortParsed.sort = "asc" ? 1 : -1),
      }; 

      return sortFormatted;
    };
    const sortFormatted = Boolean(sort) ? generateSort() : {};

    const transactions = await Transaction.find({
      $or: [
        { cost: { $regex: new RegExp(search, "i") } },
        { userId: { $regex: new RegExp(search, "i") } },
      ],
    })
      .sort(sortFormatted)
      .skip(page * pageSize)
      .limit(pageSize);

    // const total = await Transaction.countDocuments({
    //   name: { $regex: search, $options: "i" },
    // });
    const total = await Transaction.find().countDocuments();
    console.log("TOTAL:" + total);

    res.status(200).json({
      transactions,
      total,
    });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const getGeography = async (req, res) => {
  try {
    const users = await User.find();

    const mappedLocations = users.reduce((acc, { country }) => {
      const countryISO3 = getCountryIso3(country);
      if (!acc[countryISO3]) {
        acc[countryISO3] = 0;
      }
      acc[countryISO3]++;
      return acc;
    }, {});

    const formattedLocations = Object.entries(mappedLocations).map(
      ([country, count]) => {
        return { id: country, value: count };
      }
    );

    res.status(200).json(formattedLocations);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};
