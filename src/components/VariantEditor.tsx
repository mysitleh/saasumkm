"use client";

import { useState } from "react";
import { Plus, X, Trash } from "@phosphor-icons/react";

export interface VariantGroup {
  name: string;
  options: { label: string; priceAdd: number }[];
}

interface Props {
  value: VariantGroup[];
  onChange: (variants: VariantGroup[]) => void;
}

/**
 * Editor varian produk (ukuran, topping, dll).
 * Data disimpan sebagai JSON string di field `variants`.
 */
export default function VariantEditor({ value, onChange }: Props) {
  const [groups, setGroups] = useState<VariantGroup[]>(value);

  function update(newGroups: VariantGroup[]) {
    setGroups(newGroups);
    onChange(newGroups);
  }

  function addGroup() {
    update([...groups, { name: "", options: [{ label: "", priceAdd: 0 }] }]);
  }

  function removeGroup(idx: number) {
    update(groups.filter((_, i) => i !== idx));
  }

  function updateGroupName(idx: number, name: string) {
    const g = [...groups];
    g[idx] = { ...g[idx], name };
    update(g);
  }

  function addOption(groupIdx: number) {
    const g = [...groups];
    g[groupIdx] = { ...g[groupIdx], options: [...g[groupIdx].options, { label: "", priceAdd: 0 }] };
    update(g);
  }

  function removeOption(groupIdx: number, optIdx: number) {
    const g = [...groups];
    g[groupIdx] = { ...g[groupIdx], options: g[groupIdx].options.filter((_, i) => i !== optIdx) };
    update(g);
  }

  function updateOption(groupIdx: number, optIdx: number, field: "label" | "priceAdd", val: string | number) {
    const g = [...groups];
    const opts = [...g[groupIdx].options];
    opts[optIdx] = { ...opts[optIdx], [field]: field === "priceAdd" ? Number(val) || 0 : val };
    g[groupIdx] = { ...g[groupIdx], options: opts };
    update(g);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-[var(--ink-muted)]">Varian (opsional)</label>
        <button
          type="button"
          onClick={addGroup}
          className="text-xs text-[var(--accent)] hover:text-emerald-700 flex items-center gap-1"
        >
          <Plus size={12} /> Tambah Varian
        </button>
      </div>

      {groups.length === 0 && (
        <p className="text-xs text-[var(--ink-muted)]">Contoh: Ukuran (Small +0, Large +5000) atau Topping (Cheese +3000)</p>
      )}

      {groups.map((group, gi) => (
        <div key={gi} className="border border-[var(--border-warm)] rounded-[14px] p-3 space-y-2">
          <div className="flex items-center gap-2">
            <input
              value={group.name}
              onChange={(e) => updateGroupName(gi, e.target.value)}
              placeholder="Nama varian (cth: Ukuran)"
              className="flex-1 border border-[var(--border-warm)] rounded-[14px] px-2 py-1 text-sm focus:outline-none focus:ring-[3px] focus:ring-[var(--accent)]/20 focus:border-[var(--accent)]"
            />
            <button type="button" onClick={() => removeGroup(gi)} className="text-red-400 hover:text-red-600">
              <Trash size={16} />
            </button>
          </div>
          {group.options.map((opt, oi) => (
            <div key={oi} className="flex items-center gap-2 ml-4">
              <input
                value={opt.label}
                onChange={(e) => updateOption(gi, oi, "label", e.target.value)}
                placeholder="Label (cth: Large)"
                className="flex-1 border border-[var(--border-warm)] rounded-[14px] px-2 py-1 text-xs focus:outline-none focus:ring-[3px] focus:ring-[var(--accent)]/20 focus:border-[var(--accent)]"
              />
              <div className="flex items-center gap-1">
                <span className="text-xs text-[var(--ink-muted)]">+Rp</span>
                <input
                  type="number"
                  value={opt.priceAdd}
                  onChange={(e) => updateOption(gi, oi, "priceAdd", e.target.value)}
                  className="w-16 border border-[var(--border-warm)] rounded-[14px] px-2 py-1 text-xs text-right focus:outline-none focus:ring-[3px] focus:ring-[var(--accent)]/20 focus:border-[var(--accent)]"
                />
              </div>
              <button type="button" onClick={() => removeOption(gi, oi)} className="text-[var(--border-warm)] hover:text-red-400">
                <X size={12} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => addOption(gi)}
            className="ml-4 text-xs text-[var(--ink-muted)] hover:text-[var(--accent)] flex items-center gap-1"
          >
            <Plus size={12} /> Opsi
          </button>
        </div>
      ))}
    </div>
  );
}
