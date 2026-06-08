import React, { useState, useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  selectSavedFilters,
  selectActivePresetId,
  createSavedFilter,
  deleteSavedFilter,
  setActivePreset,
  loadPresetsFromStorage,
  type SavedFilter,
} from '../../store/slices/savedFiltersSlice';
import { selectFilterState, setFilters, setSearch } from '../../store/slices/filterSlice';
import { Modal } from './Modal';
import styles from './SavedFilters.module.css';

// ─── Constants ────────────────────────────────────────────────────────────

const STORAGE_KEY = 'retailr-saved-filters';

// ─── Component Types ──────────────────────────────────────────────────────

interface SavedFiltersProps {
  onLoad?: (preset: SavedFilter) => void;
}

// ─── Component ────────────────────────────────────────────────────────────

/**
 * SavedFilters component
 * Manages and displays saved filter presets with localStorage persistence
 * Features:
 * - Display list of saved filter presets
 * - Save current filters as new preset
 * - Load preset filters into Redux
 * - Delete presets with confirmation
 * - Persist to localStorage automatically
 */
export const SavedFilters: React.FC<SavedFiltersProps> = ({ onLoad }) => {
  const dispatch = useAppDispatch();
  const presets = useAppSelector(selectSavedFilters);
  const activePresetId = useAppSelector(selectActivePresetId);
  const filterState = useAppSelector(selectFilterState);

  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  /**
   * Load presets from localStorage on component mount
   */
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const loadedPresets = JSON.parse(stored) as SavedFilter[];
        dispatch(loadPresetsFromStorage(loadedPresets));
      }
    } catch (error) {
      // Silently fail if localStorage data is invalid
      console.error('Failed to load saved filters from localStorage:', error);
    }
  }, [dispatch]);

  /**
   * Save presets to localStorage whenever they change
   */
  useEffect(() => {
    try {
      if (presets.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (error) {
      console.error('Failed to save filters to localStorage:', error);
    }
  }, [presets]);

  /**
   * Handle opening the save dialog
   */
  const handleOpenSaveDialog = useCallback((): void => {
    setPresetName('');
    setShowSaveDialog(true);
  }, []);

  /**
   * Handle closing the save dialog
   */
  const handleCloseSaveDialog = useCallback((): void => {
    setShowSaveDialog(false);
    setPresetName('');
  }, []);

  /**
   * Handle saving current filters as a new preset
   */
  const handleSavePreset = useCallback((): void => {
    if (!presetName.trim()) {
      return;
    }

    dispatch(
      createSavedFilter({
        name: presetName.trim(),
        filters: filterState.filters,
        search: filterState.search,
      })
    );

    handleCloseSaveDialog();
  }, [presetName, filterState, dispatch]);

  /**
   * Handle loading a preset
   */
  const handleLoadPreset = useCallback(
    (preset: SavedFilter): void => {
      dispatch(setActivePreset(preset.id));
      dispatch(setFilters(preset.filters));
      dispatch(setSearch(preset.search || ''));

      // Call onLoad callback if provided
      if (onLoad) {
        onLoad(preset);
      }
    },
    [dispatch, onLoad]
  );

  /**
   * Handle opening the delete confirmation dialog
   */
  const handleOpenDeleteConfirm = useCallback((presetId: string): void => {
    setDeleteConfirm(presetId);
  }, []);

  /**
   * Handle closing the delete confirmation dialog
   */
  const handleCloseDeleteConfirm = useCallback((): void => {
    setDeleteConfirm(null);
  }, []);

  /**
   * Handle deleting a preset
   */
  const handleDeletePreset = useCallback((): void => {
    if (deleteConfirm) {
      dispatch(deleteSavedFilter(deleteConfirm));
      setDeleteConfirm(null);
    }
  }, [deleteConfirm, dispatch]);

  /**
   * Handle Enter key in save dialog
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>): void => {
      if (e.key === 'Enter' && presetName.trim()) {
        handleSavePreset();
      }
    },
    [presetName, handleSavePreset]
  );

  const presetToDelete = presets.find((p) => p.id === deleteConfirm);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Saved Filters</h3>
        <button
          onClick={handleOpenSaveDialog}
          className={styles.saveButton}
          type="button"
          aria-label="Save current filters as preset"
        >
          + Save Current
        </button>
      </div>

      {presets.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No saved filters yet</p>
        </div>
      ) : (
        <div className={styles.presetsList}>
          {presets.map((preset) => (
            <div key={preset.id} className={styles.presetItem}>
              <button
                onClick={() => handleLoadPreset(preset)}
                className={`${styles.presetButton} ${
                  activePresetId === preset.id ? styles.active : ''
                }`}
                type="button"
                aria-label={preset.name}
              >
                {preset.name}
              </button>
              <button
                onClick={() => handleOpenDeleteConfirm(preset.id)}
                className={styles.deleteButton}
                type="button"
                aria-label={`Delete ${preset.name}`}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Save Dialog */}
      <Modal
        open={showSaveDialog}
        onClose={handleCloseSaveDialog}
        title="Save Filter Preset"
      >
        <div className={styles.dialogContent}>
          <input
            type="text"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter preset name..."
            className={styles.dialogInput}
            autoFocus
          />
          <div className={styles.dialogActions}>
            <button
              onClick={handleSavePreset}
              className={styles.dialogSaveButton}
              disabled={!presetName.trim()}
              type="button"
            >
              Save
            </button>
            <button
              onClick={handleCloseSaveDialog}
              className={styles.dialogCancelButton}
              type="button"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <Modal
        open={deleteConfirm !== null}
        onClose={handleCloseDeleteConfirm}
        title="Delete Filter Preset"
      >
        <div className={styles.dialogContent}>
          <p className={styles.confirmText}>
            Are you sure you want to delete "{presetToDelete?.name}"?
          </p>
          <div className={styles.dialogActions}>
            <button
              onClick={handleDeletePreset}
              className={styles.dialogDeleteButton}
              type="button"
            >
              Delete
            </button>
            <button
              onClick={handleCloseDeleteConfirm}
              className={styles.dialogCancelButton}
              type="button"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SavedFilters;
