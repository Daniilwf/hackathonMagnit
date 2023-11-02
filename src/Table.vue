<template>
  <div>
    <button @click="getMetaData">Запрос метаданных</button>
    <button @click="getFieldValues">Запрос значений полей</button>
    <button @click="getCube">Запрос куба</button>

    <div v-if="loading">Загрузка...</div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: 'query',
  data() {
    return {
      loading: false
    };
  },
  methods: {
    getMetaData() {
      this.loading = true;
      axios.post('/v1/report-job/get-metadata')
          .then(response => {
            // Обработка ответа
            console.log(response.data);
          })
          .catch(error => {
            // Обработка ошибок
            console.error(error);
          })
          .finally(() => {
            this.loading = false;
          });
    },
    getFieldValues() {
      this.loading = true;
      axios.post('/v1/olap/get-field-values')
          .then(response => {
            // Обработка ответа
            console.log(response.data);
          })
          .catch(error => {
            // Обработка ошибок
            console.error(error);
          })
          .finally(() => {
            this.loading = false;
          });
    },
    getCube() {
      this.loading = true;
      axios.post('/v1/olap/get-cube')
          .then(response => {
            // Обработка ответа
            console.log(response.data);
          })
          .catch(error => {
            // Обработка ошибок
            console.error(error);
          })
          .finally(() => {
            this.loading = false;
          });
    }
  }
}
</script>

<style>
/* Стили здесь */
</style>