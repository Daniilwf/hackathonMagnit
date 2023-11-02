import './assets/main.css'

import { createApp } from 'vue'
import Table from './Table.vue'
import axios from 'axios';
import { AppConfig } from './config.js';

axios.defaults.baseURL = AppConfig.ApiUrl;

createApp(Table).mount('#app')
