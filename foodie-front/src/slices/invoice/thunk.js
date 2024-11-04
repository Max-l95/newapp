import { createAsyncThunk } from "@reduxjs/toolkit";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { APIClient } from "../../helpers/api_helper";

//Include Both Helper File with needed methods
import {
  getInvoices as getInvoicesApi,
  addNewInvoice as addNewInvoiceApi,
  updateInvoice as updateInvoiceApi,
  deleteInvoice as deleteInvoiceApi
} from "../../helpers/fakebackend_helper";

export const getInvoices = createAsyncThunk("invoice/getInvoices", async () => {
  try {
    const response = getInvoicesApi();
    return response;
  } catch (error) {
    return error;
  }
});

export const addNewInvoice = createAsyncThunk("invoice/addNewInvoice", async (invoice) => {
  try {
    const response = addNewInvoiceApi(invoice);
    toast.success("Invoice Added Successfully", { autoClose: 3000 });
    return response;
  } catch (error) {
    toast.error("Invoice Added Failed", { autoClose: 3000 });
    return error;
  }
});

export const updateInvoice = createAsyncThunk("invoice/updateInvoice", async (invoice) => {
  try {
    const response = updateInvoiceApi(invoice);
    toast.success("Invoice Updated Successfully", { autoClose: 3000 });
    const data = await response;
    return data;
  } catch (error) {
    toast.error("Invoice Updated Failed", { autoClose: 3000 });
    return error;
  }
});

const apiClient = new APIClient();

export const deleteInvoice = createAsyncThunk(
  'invoices/deleteInvoice',
  async (invoiceId, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/doceasy/api/fattureattive/elimina/${invoiceId}`);
      return invoiceId;
    } catch (error) {
      return rejectWithValue(error.response.data || 'Failed to delete invoice');
    }
  }
);


export const sendInvoice = createAsyncThunk(
  'invoices/sendInvoice',
  async (invoiceId, { rejectWithValue }) => {
    try {
      await apiClient.get(`/doceasy/api/fattureattive/invia/${invoiceId}`);
      return invoiceId;
    } catch (error) {
      return rejectWithValue(error.response.data || 'Failed to send invoice');
    }
  }
);


export const renderInvoice = createAsyncThunk(
  'invoices/renderInvoice',
  async (invoiceId, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/doceasy/api/fattureattive/anteprima/${invoiceId}`);
      
      const xmlString = response.xmlString; // Assuming the response contains xmlString
      const xsl = response.xsl; // Assuming the response contains xsl
      

      return { invoiceId, xmlString, xsl };
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to render invoice');
    }
  }
);



export const renderInvoicePassive = createAsyncThunk(
  'invoices/renderInvoicePassive',
  async (invoiceId, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/doceasy/api/fatturepassive/anteprima/${invoiceId}`);
      
      const xmlString = response.xmlString; // Assuming the response contains xmlString
      const xsl = response.xsl; // Assuming the response contains xsl
      

      return { invoiceId, xmlString, xsl };
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to render invoice');
    }
  }
);