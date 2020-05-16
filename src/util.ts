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
