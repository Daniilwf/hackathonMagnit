<template>
  <div class="container">
    <button @click="getMetaData">Запрос метаданных</button>
    <button @click="getFieldValues">Запрос значений полей</button>
    <button @click="getCube">Запрос куба</button>
    <div>
        Выберите метрику для добовляемого меню
        <select v-model="selectedValue" id="selectMetric" name="selectBox">
          <option value="COUNT">Количество</option>
          <option value="COUNT_DISTINCT">Количество различных</option>
          <option value="SUM">Сумма</option>
          <option value="MAX">Максимум</option>
          <option value="MIN">Минимум</option>
          <option value="AVG">Среднее</option>
          <option value="NONE"></option>
        </select>
      </div>
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
          <th v-for="(columnField, columnIndex) in selectedColumnFields" :key="columnIndex">
            {{ columnField.name }}
          </th>
          <th v-for="(metricField, metricIndex) in selectedMetrixFields" :key="metricIndex">
            {{ metricField[0].name + ' ('+ tableData.metrics[metricIndex].aggregationType + ')'}}
          </th>
        </tr>
          <tr v-for="(rowField, rowIndex) in selectedRowFields" :key="rowIndex">
            <th>{{ rowField.name }} </th>
            <td v-for="(rowField, rowIndex1) in tableData.rows" :key="rowIndex1">
              <div class="row">{{ rowField[rowIndex] }}</div>
            </td>
          </tr>
        </thead>
        <tbody>
        <tr v-for="(columnField, columnIndex) in tableData.columns" :key="columnIndex">
          <td v-for="(field, fieldIndex) in columnField" :key="fieldIndex">
            {{ field }}
          </td>
          <td v-for="(columnMetric, metricIndex) in tableData.metrics" :key="metricIndex">
            {{ columnMetric.values[columnIndex][0] }}
          </td>
        </tr>

        </tbody>
      </table>
      <!-- Контекстное меню  -->
      <div class="context-menu" v-if="contextMenu.visible" :style="{ top: contextMenu.top + 'px', left: contextMenu.left + 'px' }">
        <div @click="addColumn(contextMenu.field)">
          Добавить "{{ contextMenu.field.name }}" в таблицу как столбец
        </div>
        <div @click="addRow(contextMenu.field)">
          Добавить "{{ contextMenu.field.name }}" в таблицу как строку
        </div>
        <div @click="Cancel()">
          Отмена
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
    return {selectedValue: "NONE",
      data: {},
      loading: false,
      tableData: {
        columns: [],
        rows: [],
        metrics: [],
      },
      fields: {},
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
      selectedRowFields: [],
      selectedColumnFields: [],
      selectedMetrixFields: [],
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

      // const request = (this.selectedValue !== "NONE"?{
      //     columnFields: this.selectedColumnFields.map((field) => {
      //       return {
      //         fieldId: field.id,
      //         fieldType: "REPORT_FIELD"
      //       };
      //     }),
      //     rowFields: this.selectedRowFields.map((field) => {
      //       return {
      //         fieldId: field.id,
      //         fieldType: "REPORT_FIELD"
      //       };
      //     }),
      //       metrics: this.selectedMetrixFields.map((field) =>{
      //         return {
      //           field:{
      //             fieldId: field.id,
      //             fieldType: "REPORT_FIELD"
      //           },
      //           aggregationType: this.selectedValue
      //         }
      //       }),
      //     columnsInterval: {
      //       from: this.columnsInterval.from,
      //       count: this.columnsInterval.count
      //     },
      //     rowsInterval: {
      //       from: this.rowsInterval.from,
      //       count: this.rowsInterval.count
      //     },
      //     columnSort: [],
      //     rowSort: [],
      //     allFields: []
      //   }:{
      //     columnFields: this.selectedColumnFields.map((field) => {
      //       return {
      //         fieldId: field.id,
      //         fieldType: "REPORT_FIELD"
      //       };
      //     }),
      //     rowFields: this.selectedRowFields.map((field) => {
      //       return {
      //         fieldId: field.id,
      //         fieldType: "REPORT_FIELD"
      //       };
      //     }),
      //     columnsInterval: {
      //       from: this.columnsInterval.from,
      //       count: this.columnsInterval.count
      //     },
      //     rowsInterval: {
      //       from: this.rowsInterval.from,
      //       count: this.rowsInterval.count
      //     },
      //     columnSort: [],
      //     rowSort: [],
      //     allFields: []
      //   });
        

        const request = {
          columnFields: this.selectedColumnFields.map((field) => {
            return {
              fieldId: field.id,
              fieldType: "REPORT_FIELD"
            };
          }),
          rowFields: this.selectedRowFields.map((field) => {
            return {
              fieldId: field.id,
              fieldType: "REPORT_FIELD"
            };
          }),
            metrics: this.selectedMetrixFields.map(([field, value]) =>{
              return {
                field:{
                  fieldId: field.id,
                  fieldType: "REPORT_FIELD"
                },
                aggregationType: value
              }
            }),
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

      console.log(request);
      axios
          .post('/v1/olap/get-cube', request)
          .then((response) => {
            this.tableData.columns = response.data.data.columnValues;
            this.tableData.rows = response.data.data.rowValues;
            this.tableData.metrics = response.data.data.metricValues;
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
      this.selectedColumnFields.push(field);
      this.selectedColumnFields.sort((a, b) => a.ordinal - b.ordinal);
      if(this.selectedValue !== "NONE")
      {
        this.selectedMetrixFields.push([field, this.selectedValue]);
      }
      //console.log(this.selectedMetrixFields);
      this.contextMenu.visible = false;

      const fieldIndex = this.fields.findIndex(item => item.name === field.name);
      this.fields.splice(fieldIndex, 1);

      this.getCube();
    },
    addRow(field) {
      this.selectedRowFields.push(field);
      this.contextMenu.visible = false;
      const fieldIndex = this.fields.findIndex(item => item.name === field.name);
      this.fields.splice(fieldIndex, 1);

      this.getCube();
    },
    Cancel() {
      this.contextMenu.visible = false;
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
  table-layout: fixed;
}

th, td {
  border: 1px solid #ccc;
  padding: 5px;
  text-align: center;
  overflow: hidden;
}

th {
  background-color: lightgray;
  font-weight: bold;
  width: 100px;
}

td {
  border: 1px solid #ccc;
  padding: 5px;
  text-align: center;
  min-width: 100px;
}

tr td:first-child {
  width: 200px;
}
</style>