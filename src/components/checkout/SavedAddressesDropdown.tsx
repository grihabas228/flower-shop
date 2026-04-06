'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronDown, Plus, Pencil, Trash2, Check, Star } from 'lucide-react'
import type { SavedAddress } from '@/utilities/savedAddresses'

type Props = {
  addresses: SavedAddress[]
  selectedId: string | null
  onSelect: (address: SavedAddress) => void
  onAddNew: () => void
  onEdit: (address: SavedAddress) => void
  onDelete: (id: string) => void
}

export function SavedAddressesDropdown({
  addresses,
  selectedId,
  onSelect,
  onAddNew,
  onEdit,
  onDelete,
}: Props) {
  const [open, setOpen] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Strict selection: if selectedId is null, the dropdown shows a placeholder
  // (no fallback to addresses[0]) so add/edit mode is visually distinct.
  const selected = selectedId ? addresses.find((a) => a.id === selectedId) ?? null : null

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Close on escape
  useEffect(() => {
    if (!open && !confirmDeleteId) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        setConfirmDeleteId(null)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, confirmDeleteId])

  const handlePick = useCallback(
    (addr: SavedAddress) => {
      onSelect(addr)
      setOpen(false)
    },
    [onSelect],
  )

  const handleConfirmDelete = useCallback(() => {
    if (confirmDeleteId) {
      onDelete(confirmDeleteId)
      setConfirmDeleteId(null)
    }
  }, [confirmDeleteId, onDelete])

  const deleteTarget = confirmDeleteId
    ? addresses.find((a) => a.id === confirmDeleteId) ?? null
    : null

  if (addresses.length === 0) return null

  return (
    <div className="space-y-3">
      <div className="flex items-stretch gap-2">
        {/* Dropdown trigger */}
        <div ref={containerRef} className="relative flex-1 min-w-0">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="w-full flex items-center justify-between gap-3 bg-white border border-[#e8e4de] rounded-full pl-5 pr-4 py-3 text-left hover:border-[#e8b4b8] transition-colors group"
            aria-haspopup="listbox"
            aria-expanded={open}
          >
            <div className="flex-1 min-w-0">
              {selected ? (
                <p className="text-sm text-[#2d2d2d] truncate">{selected.address}</p>
              ) : (
                <p className="text-sm text-[#8a8a8a]">Выбрать адрес из истории</p>
              )}
            </div>
            <ChevronDown
              className={`w-4 h-4 text-[#8a8a8a] shrink-0 transition-transform group-hover:text-[#2d2d2d] ${
                open ? 'rotate-180' : ''
              }`}
            />
          </button>

          {open && (
            <div
              className="absolute z-30 top-full left-0 right-0 mt-2 bg-white border border-[#e8e4de] rounded-2xl shadow-[0_8px_32px_-12px_rgba(45,45,45,0.18)] overflow-hidden"
              role="listbox"
            >
              <div className="max-h-[280px] overflow-y-auto">
                {addresses.map((addr, i) => {
                  const isSelected = addr.id === selected?.id
                  return (
                    <button
                      key={addr.id}
                      type="button"
                      onClick={() => handlePick(addr)}
                      role="option"
                      aria-selected={isSelected}
                      className={`w-full text-left px-5 py-3.5 flex items-start gap-3 transition-colors ${
                        i > 0 ? 'border-t border-[#e8e4de]/60' : ''
                      } ${isSelected ? 'bg-[#faf5f0]' : 'hover:bg-[#faf5f0]/60'}`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          {addr.isDefault && (
                            <span className="inline-flex items-center gap-1 text-[10px] tracking-[0.08em] uppercase text-[#5a7a45] font-medium">
                              <Star className="w-2.5 h-2.5 fill-current" strokeWidth={0} />
                              По умолчанию
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-[#2d2d2d] leading-snug">{addr.address}</p>
                        {(addr.apartment || addr.entrance || addr.floor) && (
                          <p className="text-xs text-[#8a8a8a] mt-1">
                            {[
                              addr.apartment && `кв. ${addr.apartment}`,
                              addr.entrance && `подъезд ${addr.entrance}`,
                              addr.floor && `${addr.floor} этаж`,
                            ]
                              .filter(Boolean)
                              .join(' · ')}
                          </p>
                        )}
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 text-[#e8b4b8] shrink-0 mt-0.5" strokeWidth={2.5} />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <IconButton onClick={onAddNew} label="Добавить новый адрес" Icon={Plus} />
          <IconButton
            onClick={() => selected && onEdit(selected)}
            label="Редактировать выбранный"
            Icon={Pencil}
            disabled={!selected}
          />
          <IconButton
            onClick={() => selected && setConfirmDeleteId(selected.id)}
            label="Удалить выбранный"
            Icon={Trash2}
            disabled={!selected}
          />
        </div>
      </div>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-[#2d2d2d]/40 backdrop-blur-sm"
          onClick={() => setConfirmDeleteId(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-serif text-xl text-[#2d2d2d] mb-3">Удалить адрес?</h3>
            <p className="text-sm text-[#5a5a5a] mb-5 leading-relaxed">
              {deleteTarget.address}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 px-4 py-3 rounded-full text-sm font-medium border border-[#e8e4de] text-[#5a5a5a] hover:border-[#2d2d2d] hover:text-[#2d2d2d] transition-colors"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 px-4 py-3 rounded-full text-sm font-medium bg-[#2d2d2d] text-[#faf5f0] hover:bg-[#2d2d2d]/90 transition-colors"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function IconButton({
  onClick,
  label,
  Icon,
  disabled,
}: {
  onClick: () => void
  label: string
  Icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="w-11 h-11 rounded-full bg-white border border-[#e8e4de] flex items-center justify-center text-[#2d2d2d] hover:border-[#e8b4b8] hover:text-[#e8b4b8] transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-[#e8e4de] disabled:hover:text-[#2d2d2d]"
    >
      <Icon className="w-4 h-4" strokeWidth={1.75} />
    </button>
  )
}
