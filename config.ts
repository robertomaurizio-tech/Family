
import { DbConfig } from './types';

const STORAGE_KEY = 'ffh_db_config';

export const getDbConfig = (): DbConfig => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    const host = window.location.hostname || 'localhost';
    return {
      mode: 'mysql',
      host: 'db',
      user: 'drago',
      password: 'drago_password',
      database: 'familycash_db',
      port: '3306',
      apiUrl: `http://${host}:3003/api` // URL predefinito basato sull'host corrente
    };
  }
  return JSON.parse(saved);
};

export const saveDbConfig = (config: DbConfig) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
};
