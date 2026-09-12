function excelValue(value) {
  if (value == null) return ''
  if (typeof value === 'object') return JSON.stringify(value)
  return value
}

function safeWorksheetName(name, usedNames) {
  const base = String(name).replace(/[\\/*?:[\]]/g, '_').slice(0, 31) || 'Hoja'
  let candidate = base
  let suffix = 1
  while (usedNames.has(candidate.toLowerCase())) {
    const ending = `_${suffix}`
    candidate = `${base.slice(0, 31 - ending.length)}${ending}`
    suffix += 1
  }
  usedNames.add(candidate.toLowerCase())
  return candidate
}

function safeFilePart(value) {
  return String(value || 'comercio')
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/[. ]+$/g, '')
    .slice(0, 80) || 'comercio'
}

function fileTimestamp(date) {
  const pad = (value) => String(value).padStart(2, '0')
  return [
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    `${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`,
  ].join('_')
}

export async function downloadMantenimientoExcel({ tables, comercioNombre }) {
  const createdAt = new Date()
  const excelModule = await import('exceljs')
  const ExcelJS = excelModule.default?.Workbook ? excelModule.default : excelModule
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'AdminisGo'
  workbook.created = createdAt

  const usedNames = new Set()
  for (const table of tables) {
    const worksheet = workbook.addWorksheet(
      safeWorksheetName(table.tableName, usedNames),
      { views: [{ state: 'frozen', ySplit: 1 }] },
    )

    worksheet.columns = table.columns.map((column) => ({
      header: column,
      key: column,
      width: Math.min(45, Math.max(12, column.length + 2)),
    }))

    for (const sourceRow of table.rows) {
      const row = {}
      for (const column of table.columns) {
        row[column] = excelValue(sourceRow[column])
      }
      worksheet.addRow(row)
    }

    if (table.columns.length > 0) {
      const header = worksheet.getRow(1)
      header.font = { bold: true, color: { argb: 'FFFFFFFF' } }
      header.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4F46E5' },
      }
      header.alignment = { vertical: 'middle' }
      worksheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: 1, column: table.columns.length },
      }

      worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber === 1) return
        row.eachCell({ includeEmpty: true }, (cell, columnNumber) => {
          const textLength = String(cell.value ?? '').length + 2
          const currentWidth = worksheet.getColumn(columnNumber).width || 12
          worksheet.getColumn(columnNumber).width = Math.min(
            45,
            Math.max(currentWidth, textLength),
          )
        })
      })
    }
  }

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `backup-tablas_basicas_${safeFilePart(comercioNombre)}_${fileTimestamp(createdAt)}.xlsx`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}
