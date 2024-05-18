import { contactsService } from "../services/contactsServices.js";;
import { createContactSchema, updateContactSchema } from "../schemas/contactsSchemas.js";
import HttpError from "../helpers/HttpError.js";

export const getAllContacts = async (req, res, next) => { 
    try {
        const contacts = await contactsService.listContacts();
        res.status(200).json(contacts);
    }
    catch (error) {
        next(error);
    }
};

export const getOneContact = async (req, res, next) => {
    try {
        const { id } = req.params;
        const contact = await contactsService.getContactById(id);
        if (!contact)
            throw HttpError(404);
        res.status(200).json(contact);
    }
    catch (error) {
        next(error);
    }
};

export const deleteContact = async (req, res, next) => {
    try {
        const { id } = req.params;
        const contact = await contactsService.removeContact(id);
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
        const newContact = await contactsService.addContact(req.body);
        res.status(201).json(newContact);
    }
    catch (error) {
        next(error);
    }
};

export const updateContact = async (req, res, next) => {
    try {
        if (Object.keys(req.body).length === 0) {
            throw HttpError(400, "Body must have at least one field");
        };
        const { error } = updateContactSchema.validate(req.body);
        if (error) {
            throw HttpError(400, error.message);
        };
        const { id } = req.params;
        const updateContact = await contactsService.updateContact(id, req.body);
        if (!updateContact) {
            throw HttpError(404);
        }
        res.status(200).json(updateContact);
    }
    catch (error) {
        next(error);
    }
};
