import Contact from "../models/contact.js";
import { createContactSchema, updateContactSchema, updateStatusContactSchema} from "../schemas/contactsSchemas.js";
import HttpError from "../helpers/HttpError.js";
import { isValidObjectId } from "mongoose";

export const getAllContacts = async (req, res, next) => { 
    try {
        const { page = 1, limit = 20, favorite } = req.query;
        let contacts = [];
        if (favorite !== undefined) {
            contacts = await Contact.find({ owner: req.user.id, favorite: favorite })
        } else {
            contacts = await Contact.find({ owner: req.user.id }).skip((page-1)*limit).limit(limit);
        };
        if (contacts.length === 0)
            throw HttpError(404);
        res.status(200).json(contacts);
    }
    catch (error) {
        next(error);
    }
};

export const getOneContact = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id))
            throw HttpError(404, `Id ${id} is not valid`);
        const contact = await Contact.findOne({_id: id, owner: req.user.id});
        if (!contact)
            throw HttpError(404);
        // if (contact.owner.toString() !== req.user.id)
        //     throw HttpError(403, 'Contact is forbidden');
        res.status(200).json(contact);    
    }
    catch (error) {
        next(error);
    }
};

export const deleteContact = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id))
            throw HttpError(404, `Id ${id} is not valid`);
        const contact = await Contact.findOneAndDelete({_id: id, owner: req.user.id});
        if (!contact)
            throw HttpError(404);
        res.status(200).json(contact);
    }
    catch (error) {
        next(error);
    }
};

export const createContact = async (req, res, next) => {
    try {
        const { error } = createContactSchema.validate(req.body);
        if (error) {
            throw HttpError(400, error.message);
        };
        const newContact = await Contact.create({...req.body, owner: req.user.id});
        res.status(201).json(newContact);
    }
    catch (error) {
        next(error);
    }
};

export const updateContact = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id))
            throw HttpError(404, `Id ${id} is not valid`);
        if (Object.keys(req.body).length === 0)
            throw HttpError(400, "Body must have at least one field");
        const { error } = updateContactSchema.validate(req.body);
        if (error) {
            throw HttpError(400, error.message);
        };
        const updateContact = await Contact.findOneAndUpdate({_id: id, owner: req.user.id}, req.body, {new: true});
        if (!updateContact) {
            throw HttpError(404);
        }
        res.status(200).json(updateContact);
    }
    catch (error) {
        next(error);
    }
};

export const updateStatusContact = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id))
            throw HttpError(404, `Id ${id} is not valid`);
        const { error } = updateStatusContactSchema.validate(req.body);
        if (error) {
            throw HttpError(400, error.message);
        };
        const updateContact = await Contact.findOneAndUpdate({_id: id, owner: req.user.id}, req.body, {new: true});
        if (!updateContact) {
            throw HttpError(404);
        }
        res.status(200).json(updateContact);
    }
    catch (error) {
        next(error);
    }
};