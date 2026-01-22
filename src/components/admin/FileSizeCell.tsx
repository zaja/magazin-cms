'use client'

import React from 'react'
import type { DefaultCellComponentProps } from 'payload'

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export const FileSizeCell: React.FC<DefaultCellComponentProps> = ({ rowData }) => {
  const filesize = rowData?.filesize as number | undefined
  return <span>{formatBytes(filesize || 0)}</span>
}

export default FileSizeCell
