import { DataSource } from 'typeorm';
import * as moment from 'moment';

export const getThepriceDroppingValue = async (conn: DataSource): Promise<number> => {
  const sql = `SELECT * FROM checkins_hotels_policy WHERE id = 2`;
  const [rows] = await conn.query(sql);
  return rows[0].totalRate;
};

export const getThepriceReaddedValue = async (conn: DataSource): Promise<number> => {
  const sql = `SELECT * FROM checkins_hotels_policy WHERE id = 2`
  const [rows] = await conn.query(sql)
  return rows[0].checkoutRate
}

export const getThepriceIncreaseValue = async (conn: DataSource): Promise<number> => {
  const sql = `SELECT * FROM checkins_hotels_policy WHERE id = 2`;
  const [rows] = await conn.query(sql);
  return rows[0].publishedRate;
};

export const formatDate = (date : any) => {
  const momentDate = moment(date).utcOffset(0, true);
  return momentDate.format("YYYY-MM-DD");
};

export const calculateTotalRoomNights = (startDate : any, endDate : any, rooms : any) => {
  const momentDate = moment(startDate).utcOffset(0, true);
  const momentDate2 = moment(endDate).utcOffset(0, true);
  const diffInDay = momentDate2.diff(momentDate, "days");
  return diffInDay * rooms;
};

export const generateHeaders = (ipAddress : any, correlationId : any) => {
  return {
    "Content-Type": "application/json; charset=utf-8",
    "Accept-Encoding": "gzip,deflate,compress",
    apiKey: process.env.ZENTRUMHUB_API_KEY,
    accountId: process.env.ZENTRUMHUB_ACCOUNT_ID,
    "customer-ip": ipAddress,
    correlationId: correlationId,
  };
};
