<template>
  <div class="container">
    <button @click="getMetaData">Запрос метаданных</button>
    <button @click="getFieldValues">Запрос значений полей</button>
    <button @click="getCube">Запрос куба</button>
    <button @click="changeMetricPlacement">Поменять расположение метрик</button>
    <div v-if="loading">Загрузка...</div>
    <div>{{ data.message }}</div>
    <div v-if="data.success">
      <div class="field-names">
        <div v-for="(field, index) in fields" :key="index" class="field-name" @contextmenu.prevent="showContextMenu($event, field)" :title="field.description">
          {{ field.name }}
        </div>
      </div>
      <div>Строки:</div>
      <div class="field-names">
        <div v-for="(field, index) in selectedColumnFields" :key="index" class="field-name" @contextmenu.prevent="showContextMenu($event, field)" :title="field.description">
          <span @click="closeColumnField(index)" class="close-icon">✖</span>
          {{ field.name }}
        </div>
      </div>
      <div>Столбцы:</div>
      <div class="field-names">
        <div v-for="(field, index) in selectedRowFields" :key="index" class="field-name" :title="field.description">
          <span @click="closeRowField(index)" class="close-icon">✖</span>
          {{ field.name }}
        </div>
      </div>

      <table>
        <thead>
          <!-- Если нет метрик -->
          <tr v-if="metricPlacement === 'ROWS'" v-for="(rowField, rowIndex) in selectedRowFields" :key="rowIndex">
            <th v-for="(columnField, columnIndex) in selectedColumnFields" :key="columnIndex">
              <th v-if="rowIndex !== selectedRowFields.length - 1"></th>
              <th v-else>
                {{ columnField.name }}
              </th>
            </th>
            <th>{{ rowField.name }} </th>
              <td v-for="(rowField, rowIndex1) in tableData.rows" :key="rowIndex1" class="row">
                {{ rowField[rowIndex] }}
              </td>
          </tr>
          <!-- Если данные у нас по столбцам -->
           <tr v-if="(selectedRowFields.length === 0)">
               <th v-for="(columnField, columnIndex) in selectedColumnFields" :key="columnIndex">
                 {{ columnField.name }}
               </th>
               <th  v-if="metricPlacement === 'COLUMNS'" v-for="(metricField, metricIndex) in selectedMetrixFields" :key="metricIndex">
                  {{ metricField[0].name + ' ('+ tableData.metrics[metricIndex].aggregationType + ')'}}
               </th>
           </tr>
          <!-- Если нет метрик -->
          <tr v-if="metricPlacement === 'COLUMNS'" v-for="(rowField, rowIndex) in selectedRowFields" :key="rowIndex">
            <th v-for="(columnField, columnIndex) in selectedColumnFields" :key="columnIndex">
              <tr v-if="rowIndex !== selectedRowFields.length - 1"></tr>
              <th v-else>
                {{ columnField.name }}
              </th>
            </th>
            <th @click="">{{ rowField.name }} </th>
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
          <tr  v-if="metricPlacement === 'ROWS'" v-for="(metricField, metricIndex) in selectedMetrixFields" :key="metricIndex">
            <th>{{ metricField[0].name + ' ('+ tableData.metrics[metricIndex].aggregationType + ')'}}</th>
            <td v-for="(metricField, metricIndex) in tableData.metrics[metricIndex].values[columnIndex]"> {{ metricField }}</td>
          </tr>
          <td v-if="metricPlacement === 'COLUMNS'" v-for="(columnMetric, metricIndex) in tableData.metrics" :key="metricIndex">
            {{ columnMetric.values[columnIndex][0] }}
          </td>
        </tr>

        </tbody>
      </table>
      <!-- Контекстное меню -->
      <div class="context-menu" v-if="contextMenu.visible && !contextFilterMenu.visible" :style="{ top: contextMenu.top + 'px', left: contextMenu.left + 'px' }">
        <div @click="addColumn(contextMenu.field)">
          Добавить "{{ contextMenu.field.name }}" в таблицу как столбец
        </div>
        <div @click="addRow(contextMenu.field)">
          Добавить "{{ contextMenu.field.name }}" в таблицу как строку
        </div>
        <div @click="showMetric(contextMenu.field)" @mouseenter="showMetricMenu" @mouseleave="hideMetricMenu">
          Добавить к "{{ contextMenu.field.name }}" метрику
        </div>
        <div class="context-menu" v-if="contextMetricOperationMenu.visible" :style="{ top: contextMetricOperationMenu.top + 'px', left: contextMetricOperationMenu.left + 'px' }" @mouseenter="showMetricMenu" @mouseleave="hideMetricMenu">
          <div v-for="operation in metricOperations" :key="operation" @click="setMetricOperation(contextMenu.field, operation)">
            {{ operation }}
          </div>
        </div>
        <div @click="addFilter(contextMenu.field)">
          Добавить к "{{ contextMenu.field.name }}" фильтр
        </div>
        <div @click="Cancel()">
          Отмена
        </div>
      </div>
      <div class="context-menu" v-if="contextFilterMenu.visible" :style="{ top: contextFilterMenu.top + 'px', left: contextFilterMenu.left + 'px' }">
        <b style="font-weight: bold">Действия с группой фильтров</b>
        <div @click="changeOperationType()">
          Установить тип операций в группе. На данный момент {{this.filterGroup.operationType}}
        </div>
        <div @click="changeInvertResultGroup()">
          Инвертировать результат для всех отфильрованных полей. На данный момент {{this.filterGroup.invertResult}}
        </div>
        <div @click="changeInvertResult()">
          Инвертировать результат для этого поля. На данный момент {{this.filter.invertResult}}
        </div>
        <div @click="addColumn(contextFilterMenu.field)" @mouseenter="showFilterMenu" @mouseleave="hideFilterMenu">
          Установит тип фильтра. На данный момент {{this.filter.filterType}}
        </div>
        <div class="context-menu" v-if="contextFilterOperationTypeMenu.visible" :style="{ top: contextFilterOperationTypeMenu.top + 'px', left: contextFilterOperationTypeMenu.left + 'px' }" @mouseenter="showFilterMenu" @mouseleave="hideFilterMenu">
          <div v-for="operation in filterOperations" :key="operation" @click="setFilterOperation(operation)">
            {{ operation }}
          </div>
        </div>
        <div @click.left="incrementRounding()" @click.right="decrementRounding()">
          Установить количество знаков после запятой при округлении. На данный момент {{this.filter.rounding}}
        </div>
        <div @click="changeCanRounding()" >
          Осуществлять ли округление значений? На данный момент {{this.filter.canRounding}}
        </div>
        <div @click="applyFilter(contextMenu.field, true)">
          Применить фильтр
        </div>
        <div @click="CancelFilter()">
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
    return {
      data: {},
      loading: false,
      tableData: {
        columns: [],
        rows: [],
        metrics: [],
      },
      fields: {},
      metricPlacement: 'COLUMNS',
      contextMenu: {
        visible: false,
        top: 0,
        left: 0,
        field: null,
      },
      contextMetricOperationMenu: {
        visible: false,
        top: 0,
        left: 0,
        field: null,
      },
      contextFilterMenu: {
        visible: false,
        top: 0,
        left: 0,
        field: null,
      },
      contextFilterOperationTypeMenu: {
        visible: false,
        top: 0,
        left: 0,
        field: null,
      },
      columnsInterval: {
        from: 0,
        count: 10
      },
      rowsInterval: {
        from: 0,
        count: 10
      },
      selectedRowFields: [],
      selectedColumnFields: [],
      filterGroup: {
        operationType: "AND",
        invertResult: false,
        childGroups: [],
        filters: [],
        allFields: []
      },
      filter: {
        field: {
          fieldId: 0,
          fieldType: "REPORT_FIELD",
        },
        filterType: "EMPTY",
        invertResult: true,
        rounding: 0,
        canRounding: true,
        values: []
      },
      metricOperations: [
          'COUNT',
          'COUNT-DISTINCT',
          'SUM',
          'MAX',
          'MIN',
          'AVG'
      ],
      filterOperations: [
        'EMPTY',
        'IN_LIST',
        'CONTAINS_CS',
        'CONTAINS_CI',
        'EQUALS',
        'GREATER',
        'LESSER',
        'GREATER_OR_EQUALS',
        'LESSER_OR_EQUALS',
        'BETWEEN',
        'BLANK'
      ],
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
          metricPlacement: this.metricPlacement,
          filterGroup: this.filterGroup,
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
            console.log(this.tableData)
            this.tableData.metrics = response.data.data.metricValues;
          })
          .catch((error) => {
            console.error(error);
          })
          .finally(() => {
            this.loading = false;
          });
    },
    changeMetricPlacement() {
      this.metricPlacement = this.metricPlacement === "COLUMNS" ? "ROWS" : "COLUMNS";
      this.getCube();
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
    showMetric(event, field) {
      this.contextMetricOperationMenu.top = event.clientY;
      this.contextMetricOperationMenu.left = event.clientX;
      this.contextMetricOperationMenu.field = field;
      this.contextMetricOperationMenu.visible = true;
    },
    showMetricMenu() {
      this.contextMetricOperationMenu.visible = true;
    },
    hideMetricMenu() {
      this.contextMetricOperationMenu.visible = false;
    },
    setMetricOperation(field, operation) {
      this.selectedMetrixFields.push([field, operation]);
      this.hideMetricMenu();
      this.getCube();
    },
    addFilter(event, field) {
      this.contextMenu.visible = false;

      this.contextFilterMenu.top = event.clientY;
      this.contextFilterMenu.left = event.clientX;
      this.contextFilterMenu.field = field;
      this.contextFilterMenu.visible = true;
    },
    closeColumnField(index) {
      this.fields.push(this.selectedColumnFields[index]);
      this.fields.sort((a, b) => a.ordinal - b.ordinal);
      this.selectedColumnFields.splice(index, 1);
      this.getCube();
    },
    closeRowField(index) {
      this.fields.push(this.selectedRowFields[index]);
      this.fields.sort((a, b) => a.ordinal - b.ordinal);
      this.selectedRowFields.splice(index, 1);
      this.getCube();
    },
    showFilterMenu() {
      this.contextFilterOperationTypeMenu.visible = true;
    },
    hideFilterMenu() {
      this.contextFilterOperationTypeMenu.visible = false;
    },
    setFilterOperation(operation) {
      this.filter.filterType = operation;
      this.hideFilterMenu();
    },
    changeOperationType() {
      this.filterGroup.operationType = this.filterGroup.operationType === "AND" ? "OR" : "AND";
    },
    Cancel() {
      this.contextMenu.visible = false;
    },
    changeInvertResultGroup() {
      this.filterGroup.invertResult = this.filterGroup.invertResult !== true;
    },
    changeInvertResult() {
      this.filter.invertResult = this.filter.invertResult !== true;
    },
    changeCanRounding() {
      this.filter.canRounding = this.filter.canRounding !== true;
    },
    incrementRounding() {
      this.filter.rounding++;
    },
    decrementRounding() {
      if (this.filter.rounding > 0) {
        this.filter.rounding--;
      }
    },
    CancelFilter() {
      this.contextFilterMenu.visible = false;
    },
    applyFilter(field, isColumn) {
      if (isColumn) {
        const fieldIndex = this.selectedColumnFields.findIndex(item => item.name === field.name);
        if (fieldIndex !== -1) {
          this.filter.values = this.tableData.columns.map(column => column[fieldIndex]);
        }
        this.filter.field.fieldId = field.id;
        this.filterGroup.filters.push(this.filter);
        this.filterGroup.allFields.push({fieldId: field.id, fieldType: "REPORT_FIELD"});
      }
      this.contextFilterMenu.visible = false;
      this.getCube();
    }
  }
}
</script>

<style>
.field-names {
  display: flex;
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
  empty-cells: hide;
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

.field-name {
  flex: 0 0 125px;
  height: 100px;
  text-align: center;
  border: 1px solid #ccc;
  margin: 5px;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}

.close-icon {
  position: absolute;
  top: 5px; /* Подстройте положение по вертикали по вашему усмотрению */
  right: 5px; /* Подстройте положение по горизонтали по вашему усмотрению */
  cursor: pointer;
  font-size: 18px; /* Подстройте размер шрифта по вашему усмотрению */
  color: red; /* Цвет иконки закрытия */
}

</style>
