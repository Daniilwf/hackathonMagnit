<template>
  <div class="container">
    <button @click="getMetaData">Запрос метаданных</button>
    <button @click="getFieldValues">Запрос значений полей</button>
    <button @click="getCube">Запрос куба</button>
    <div v-if="loading">Загрузка...</div>
    <div>{{ data.message }}</div>
    <div v-if="data.success">
      <div class="field-names">
        <div v-for="(field, index) in fields" :key="index" class="field-name" @contextmenu.prevent="showContextMenu($event, field)" :title="field.description">
          {{ field.name }}
        </div>
      </div>
      <table>
        <thead>
        <tr>
          <th v-for="(columnField, columnIndex) in tableData.columns" :key="columnIndex">
            {{ columnField.name }}
          </th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="(rowData, rowIndex) in tableData.rows" :key="rowIndex">
          <td v-for="(columnField, columnIndex) in tableData.columns" :key="columnIndex">
            {{ rowData[columnIndex] }}
          </td>
        </tr>
        </tbody>
      </table>
      <!-- Контекстное меню -->
      <div class="context-menu" v-if="contextMenu.visible" :style="{ top: contextMenu.top + 'px', left: contextMenu.left + 'px' }">
        <div @click="addColumn(contextMenu.field)">
          Добавить "{{ contextMenu.field.name }}" в таблицу как столбец
        </div>
      </div>
    </div>
    <div>
      <label for="columnsInterval">Columns Interval:</label>
      <input type="number" id="columnsInterval" v-model="columnsInterval.from" placeholder="From">
      <input type="number" v-model="columnsInterval.count" placeholder="Count">
      <br>
      <label for="rowsInterval">Rows Interval:</label>
      <input type="number" id="rowsInterval" v-model="rowsInterval.from" placeholder="From">
      <input type="number" v-model="rowsInterval.count" placeholder="Count">
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: 'query',
  data() {
    return {
      data: {},
      loading: false,
      tableData: {
        columns: [],
        rows: []
      },
      fields: [],
      contextMenu: {
        visible: false,
        top: 0,
        left: 0,
        field: null,
      },
      columnsInterval: {
        from: 0,
        count: 100
      },
      rowsInterval: {
        from: 0,
        count: 100
      },
      columnValues: [],
      rowValues: [],
    };
  },
  methods: {
    getMetaData() {
      this.loading = true;
      axios.post('/v1/report-job/get-metadata', {})
          .then(response => {
            this.data = response.data;
            this.fields = this.data.data.fields;
          })
          .catch(error => {
            console.error(error);
          })
          .finally(() => {
            this.loading = false;
          });
    },
    getFieldValues() {
      this.loading = true;
      axios.post('/v1/olap/get-field-values', {})
          .then(response => {
            this.data = response.data;
          })
          .catch(error => {
            console.error(error);
          })
          .finally(() => {
            this.loading = false;
          });
    },
    getCube() {
      this.loading = true;
      const request = {
        columnFields: this.tableData.columns.map((column) => {
          return {
            fieldId: column.id,
            fieldType: "REPORT_FIELD"
          };
        }),
        rowFields: [],
        columnsInterval: {
          from: this.columnsInterval.from,
          count: this.columnsInterval.count
        },
        rowsInterval: {
          from: this.rowsInterval.from,
          count: this.rowsInterval.count
        },
        columnSort: [],
        rowSort: [],
        allFields: []
      };
      axios
          .post('/v1/olap/get-cube', request)
          .then((response) => {
            this.tableData.rows = response.data.data.columnValues;
            console.log(this.tableData)
          })
          .catch((error) => {
            console.error(error);
          })
          .finally(() => {
            this.loading = false;
          });
    },
    showContextMenu(event, field) {
      event.preventDefault();
      this.contextMenu.top = event.clientY;
      this.contextMenu.left = event.clientX;
      this.contextMenu.field = field;
      this.contextMenu.visible = true;
    },
    addColumn(field) {
      // Сортируем столбцы по полю "ordinal" перед добавлением
      this.tableData.columns.push(field);
      this.tableData.columns.sort((a, b) => a.ordinal - b.ordinal);

      this.contextMenu.visible = false;
      const fieldIndex = this.data.data.fields.findIndex(item => item.name === field.name);
      this.fields.splice(fieldIndex, 1);
    },
  }
}
</script>

<style>
.field-names {
  display: flex;
}

.field-name {
  flex: 0 0 125px;
  height: 100px;
  text-align: center;
  border: 1px solid #ccc;
  margin: 5px;
  display: flex;
  justify-content: center;
  align-items: center;
}

body {
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  min-height: 100vh;
}

.container {
  margin-top: initial;
}

.context-menu {
  position: absolute;
  background-color: #fff;
  border: 1px solid #ccc;
  padding: 10px;
  z-index: 9999;
}

.context-menu div {
  cursor: pointer;
  padding: 5px;
}

table {
  border-collapse: collapse;
  margin-top: 10px;
  width: 100%;
}

th, td {
  border: 1px solid #ccc;
  padding: 5px;
  text-align: center;
}

th {
  background-color: lightgray;
  font-weight: bold;
}

td {
  border: 1px solid #ccc;
  padding: 5px;
  text-align: center;
  height: 100px;
  min-width: 100px;
}
</style>