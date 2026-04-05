import { v2 as cloudinary } from 'cloudinary'
import productModel from '../models/productModel.js'

// function for add product
const addProduct = async (req, res) => {
    try {
        const { name, description, price, category, subCategory, sizes, bestseller, discount, discountActive, collections, showInCollection } = req.body;

        const image1 = req.files.image1 && req.files.image1[0];
        const image2 = req.files.image2 && req.files.image2[0];
        const image3 = req.files.image3 && req.files.image3[0];
        const image4 = req.files.image4 && req.files.image4[0];

        const images = [image1, image2, image3, image4].filter((item) => item !== undefined);

        let imagesUrl = await Promise.all(
            images.map(async (item) => {
                let result = await cloudinary.uploader.upload(item.path, { resource_type: 'image' });
                return result.secure_url;
            })
        );

        const productData = {
            name,
            description,
            price: Number(price),
            category,
            subCategory,
            bestseller: bestseller === 'true' ? true : false,
            sizes: JSON.parse(sizes),
            image: imagesUrl,
            discount: Number(discount) || 0,
            discountActive: discountActive === 'true' ? true : false,
            collections: collections ? JSON.parse(collections) : [],
            showInCollection: showInCollection === 'true' ? true : false,
            date: Date.now()
        };

        const newProduct = new productModel(productData);
        await newProduct.save();

        res.json({ success: true, message: "Product added successfully" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// function for list product
const listProduct = async (req, res) => {
    try {
        const Products = await productModel.find({});
        res.json({ success: true, Products });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// function for removing product
const removeProduct = async (req, res) => {
    try {
        await productModel.findByIdAndDelete(req.body.id)
        res.json({ success: true, message: "product removed successfully" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// function for single product
const singleProduct = async (req, res) => {
    try {
        const { productId } = req.body;
        const product = await productModel.findById(productId);
        res.json({ success: true, product });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// function for update product discount
const updateDiscount = async (req, res) => {
    try {
        const { productId, discount, discountActive } = req.body;
        await productModel.findByIdAndUpdate(productId, {
            discount: Number(discount),
            discountActive: discountActive
        })
        res.json({ success: true, message: "Discount updated successfully" })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

// function for update product collection
const updateCollection = async (req, res) => {
    try {
        const { productId, collections, showInCollection } = req.body;
        await productModel.findByIdAndUpdate(productId, {
            collections: collections || [],
            showInCollection: showInCollection
        })
        res.json({ success: true, message: "Collection updated successfully" })
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message })
    }
}

export { listProduct, addProduct, removeProduct, singleProduct, updateDiscount, updateCollection }