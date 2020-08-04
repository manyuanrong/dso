// 驼峰转下划线
export function camel2line(key: string) {
  return key.replace(/([A-Z])/g, "_$1").toLowerCase();
}

// 下划线转驼峰
export function line2camel(key: string) {
  return key.replace(/_(\w)/g, function (_, letter) {
    return letter.toUpperCase();
  });
}
export function replaceBackTick(sql: string) {
  return sql.replace(/`/g, " ").replace(/"/g, "'");
}

export function rowsPostgres(queryResult: any) {
  let returnedResult: any = [];

  const rows = queryResult.rows;
  const columns = queryResult.rowDescription.columns;
  const columnNames: string[] = columns.map((column: any) => {
    return column.name;
  });
  rows.forEach((row: any, rowIndex: any) => {
    let rowData: any = {};
    row.forEach((rVal: any, rIndex: any) => {
      const columnName: string = columnNames[rIndex];
      rowData[columnName] = row[rIndex];
    });
    returnedResult.push(rowData);
  });

  return returnedResult;
}
