/* eslint-disable @typescript-eslint/require-await */
declare const __static: string;

import eventBus from '@/eventBus';
import fs from 'fs';
import path from 'path';
import notifier from 'node-notifier';
import store from '@/store/main';
import { Integration } from '../template';
import axios from 'axios';
import { i18n } from '@/locales/i18n';

import sanitize from 'sanitize-filename';
import sevenBin from '7zip-bin';
import Seven from 'node-7z';

const url = 'https://sfmlab.com';

import { databases } from '@/plugins/models-db/init';

const sfmlabInstance = axios.create({
  method: 'get',
  baseURL: url,
  responseType: 'text',
  timeout: 10000
});

export default class SFMLab extends Integration {
  constructor() {
    super('sfmlab');
    this.initializeLocalDatabase();
  }
  async initializeLocalDatabase(): Promise<boolean> {
    const query = `CREATE TABLE IF NOT EXISTS 'models'(
      "id"	INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "remoteId" INTEGER NOT NULL,
      "name"	TEXT NOT NULL,
      "extension"	TEXT NOT NULL,
      "folderPath" TEXT NOT NULL,
      "path"	TEXT NOT NULL UNIQUE,
      "category"	TEXT NOT NULL,
      "size" INTEGER,
      "image"	TEXT,
      "installed" INTEGER NOT NULL
    )`;
    await this.runQuery(query);
    return Promise.resolve(true);
  }
  runQuery(query: string): Promise<boolean | Error> {
    return new Promise((resolve, reject): void => {
      this.db.run(query, (err: Error) => {
        if (err) {
          reject(err);
        } else {
          resolve(true);
        }
      });
    });
  }

  fetchQuery(query: string): Promise<Model[] | Error> {
    return new Promise((resolve, reject): void => {
      this.db.all(query, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }
  async fetchItemsFromDatabase(category?: string, page?: string): Promise<any | Error> {
    try {
      const params: any = {};
      if (category !== undefined) {
        params.category = category;
      }

      if (page !== undefined) {
        params.page = page;
      }

      const root = await sfmlabInstance.get('/', {
        params: params
      });
      const parser = new DOMParser();
      const dom = parser.parseFromString(root.data, 'text/html');

      const body = dom.querySelectorAll('.content-container .entry-content .entry-list .entry');
      const options = dom.querySelectorAll('.content-container .sidebar .panel .panel__body select#id_category option:not(:checked)');

      const paginator = dom.querySelector('.content-container .pagination');

      const models: Model[] = [];
      const categories = this.fetchCategories(options);
      const lastPage = this.detectLastPage(paginator);

      for (const element of body) {
        const title = element.querySelector('.entry__body .entry__title a')?.innerHTML;
        const link = element.querySelector('.entry__body .entry__title a')?.getAttribute('href');
        const id = (link?.match(/\d+/) as any[])[0];
        const image = url + element.querySelector('.entry__heading a img')?.getAttribute('src');
        const category = element.querySelector('.entry__tags .entry__tag')?.innerHTML;

        const dbQuery = `SELECT * FROM models WHERE remoteId=${id}`;
        const item = (await this.fetchQuery(dbQuery) as Model[]);

        models.push({
          id: Number(id),
          remoteId: Number(id),
          name: title ?? '',
          image: image,
          extension: '.max',
          category: category ?? '',
          size: item.length !== 0 ? item[0].size : 0,
          folderPath: item.length !== 0 ? item[0].folderPath : '',
          path: item.length !== 0 ? item[0].path : '',
          installed: item.length !== 0,
        });
      }
      return {
        models: models,
        categories: categories,
        totalPages: lastPage
      };
    } catch (e) {
      if (e.code === 'ECONNABORTED') {
        store.commit('setOfflineStatus', true);
        const dbQuery = 'SELECT * FROM models';
        return new Promise((resolve, reject): void => {
          this.db.all(dbQuery as string, (err, rows) => {
            if (err) {
              reject(err);
            } else {
              const obj = {
                models: rows,
                categories: [],
                totalPages: 1
              };
              resolve(obj);
            }
          });
        });
      }
      console.log(e);
      return [];
    }
  }

  async login(): Promise<void> {
    try {
      const csrf = await sfmlabInstance.get('/accounts/login');
      console.log(csrf);
      const root = await sfmlabInstance.post('/accounts/login/?next=/', {
        csrfmiddlewaretoken: 'o4va504jx1VkqCKcHcHR7xyamV5tBEVYXjNySZPqB4kKdY7FwpBMwmSc3ceWI4eC',
        login: 'aks113',
        remember: true,
        password: '2GGyq9jvkYHiTjFXSq4E'
      });

      console.log(root);
    } catch (e) {
      console.log(e);
    }
  }

  fetchCategories(options: NodeListOf<Element>): Category[] {
    const categories: any[] = [];

    options?.forEach((element: any) => {
      categories.push({
        id: element.value,
        parentId: -1,
        slug: element.value,
        name: element.innerText
      });
    });
    return categories;
  }

  detectLastPage(paginator: Element | null): number {
    const activeLink = paginator?.querySelector('li.active a')?.innerHTML;
    const lastLink = paginator?.querySelector('li.last a')?.getAttribute('href');

    const href = lastLink !== null ? lastLink : activeLink;
    return Number(href?.split('=')[1]) ?? 1;
  }

  dynamicQueryBuilder(params: QueryParameters): string {
    throw new Error('Method not implemented.');
  }
  updateBuilder(model: Model): string {
    throw new Error('Method not implemented.');
  }
  async reindexCatalog(files: string[]): Promise<DatabaseUpdateInformation> {
    throw new Error('Method not implemented.');
  }

  async fetchDownloadLink(projectID: number): Promise<any | Error> {
    store.commit('setLoadingStatus', false);
    try {
      const root = await sfmlabInstance.get(`/project/${projectID}/`);
      const parser = new DOMParser();
      const dom = parser.parseFromString(root.data, 'text/html');

      const link = dom.querySelector('.content-container .main-upload table tbody tr td a');

      const filename = dom.querySelector('.content-container .main-upload table tbody tr td .js-edit-input__wrapper strong')?.innerHTML;

      if (link !== null) {
        const downloadPage = await sfmlabInstance.get((link.getAttribute('href') as string));
        const dom = parser.parseFromString(downloadPage.data, 'text/html');

        const downloadLink = dom.querySelector('.content-container .main-upload .project-description-div p a');

        if (downloadLink !== null) {
          store.commit('setLoadingStatus', true);
          return Promise.resolve({
            link: downloadLink.getAttribute('href'),
            filename: filename
          });
        }
      }
    } catch (e) {
      store.commit('setLoadingStatus', true);
      return Promise.reject(new Error(e));
    }
    return '';
  }

  async deleteItem(item: Model): Promise<boolean | Error> {
    // Check if temp folder exists
    if (fs.existsSync(item.path)) {
      fs.rmdirSync(item.path, { recursive: true });
    }
    const dbQuery = `DELETE FROM 'models' WHERE remoteId=${item.remoteId}`;

    await this.runQuery(dbQuery);
    // Update databases record
    const db = databases.get('databases.integrations.sfmlab');
    db.totalsize -= item.size ?? 0;
    db.count--;

    databases.set('databases.integrations.sfmlab', db);
    store.commit('setApplicationDatabases', databases.get('databases'));
    store.commit('setCurrentDatabase', store.state.db.currentDB?.url ?? 'sfmlab');
    eventBus.$emit('item-deleted');

    const notifierObject = {
      appName: 'com.longsightedfilms.meshhouse',
      title: i18n.t('notifications.delete.title', { site: 'SFMLab' }).toString(),
      message: i18n.t('notifications.delete.text', { title: item.name }).toString(),
      icon: path.join(__static, '../build/icons', '512x512.png'),
      wait: true
    };
    notifier.notify(notifierObject);

    return Promise.resolve(true);
  }

  async downloadItem(item: any): Promise<boolean | Error> {
    const isFolderSet = databases.get('databases.integrations.sfmlab').path !== null;

    if (!isFolderSet) {
      return Promise.reject(new Error('Path not set'));
    }

    const dbPath = databases.get('databases.integrations.sfmlab').path ?? '';

    const cancelToken = axios.CancelToken.source();

    const download = {
      img: item.image,
      title: item.name,
      path: path.join(databases.get('databases.integrations.sfmlab').path, sanitize(item.name)),
      totalSize: 0,
      downloadedSize: 0,
      startedAt: new Date(),
      cancelToken: cancelToken
    };
    store.commit('addDownloadItem', download);

    const { link, filename } = await this.fetchDownloadLink(item.remoteId);

    try {
      const file: Blob = (await sfmlabInstance.get(`${link}?timestamp=${new Date().getTime()}`, {
        cancelToken: cancelToken.token,
        responseType: 'blob',
        timeout: 0,
        onDownloadProgress: (progressEvent: any) => {
          const loaded = progressEvent.loaded;
          const total = progressEvent.total;
          download.totalSize = Number(total);
          download.downloadedSize = Number(loaded);

          store.commit('updateDownloadItem', download);
        }
      })).data;
      // Unpack archive in folder
      await this.installFile(file, item, filename);

      // Insert downloaded item into local DB
      const dbQuery = `INSERT INTO 'models' VALUES
      (null, ${item.id}, '${item.name}', '.sfm', '${download.path}',
      '${download.path}', '${item.category}', ${download.totalSize}, '${item.image}', 1)`;
      await this.runQuery(dbQuery);
      // Notify when downloaded
      const notifierObject = {
        appName: 'com.longsightedfilms.meshhouse',
        title: i18n.t('notifications.download.title', { site: 'SFMLab' }).toString(),
        message: i18n.t('notifications.download.text', { title: item.name }).toString(),
        icon: path.join(__static, '../build/icons', '512x512.png'),
        wait: true
      };
      notifier.notify(notifierObject);
      eventBus.$emit('download-completed');

      // Update databases record
      const db = databases.get('databases.integrations.sfmlab');
      db.totalsize += download.totalSize;
      db.count++;

      databases.set('databases.integrations.sfmlab', db);
      store.commit('setApplicationDatabases', databases.get('databases'));
      store.commit('setCurrentDatabase', store.state.db.currentDB?.url ?? 'sfmlab');

      return Promise.resolve(true);
    } catch (e) {
      if (axios.isCancel(e)) {
        return Promise.resolve(true);
      } else {
        console.log(e);
        download.totalSize = -1;
        download.downloadedSize = -1;
        store.commit('updateDownloadItem', download);
        return Promise.reject(new Error(e));
      }
    }
  }



  async installFile(blob: Blob, item: Model, filename: string): Promise<boolean | Error> {
    const tmpPath = path.join(databases.get('databases.integrations.sfmlab').path, '.meshhouse_temp');
    const tmpFile = path.join(tmpPath, sanitize(filename));

    // Check if temp folder exists
    if (!fs.existsSync(tmpPath)) {
      fs.mkdirSync(tmpPath);
    }

    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();

      fileReader.onload = (e: any): Promise<boolean | Error> => {
        if(!fs.existsSync(tmpFile)) {
          fs.writeFileSync(tmpFile, new Uint8Array(Buffer.from(e.target.result)));
        }

        console.log('File written', tmpFile);
        store.commit('setLoadingStatus', false);

        const pathTo7zip = sevenBin.path7za;
        const outputPath = path.join(databases.get('databases.integrations.sfmlab').path, sanitize(item.name));

        if (!fs.existsSync(outputPath)) {
          fs.mkdirSync(outputPath);
        }

        return (Seven as any).extractFull(tmpFile, outputPath, {
          recursive: true,
          $bin: pathTo7zip,
        }).on('end', () => {
          store.commit('setLoadingStatus', true);
          fs.rmdirSync(tmpPath, { recursive: true });
          return resolve(true);
        }).on('error', (err: any) => {
          store.commit('setLoadingStatus', true);
          return reject(new Error(err));
        });
      };
      fileReader.readAsArrayBuffer(blob);
    });
  }
}
