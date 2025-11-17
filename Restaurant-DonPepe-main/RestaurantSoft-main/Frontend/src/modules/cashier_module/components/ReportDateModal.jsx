import React, { useState, useEffect, useMemo } from 'react';
import { X, Calendar, Download, FileText, TrendingUp, AlertCircle } from 'lucide-react';
import '../styles/report_date_modal.css';

const ReportDateModal = ({ isOpen, onClose, onGenerate, availableData }) => {
  const [selectedOption, setSelectedOption] = useState('day'); // 'day' or 'month'
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  // Obtener años y meses disponibles desde los datos
  const { availableYears, availableMonths, availableDates } = useMemo(() => {
    if (!availableData || availableData.length === 0) {
      return { availableYears: [], availableMonths: {}, availableDates: new Set() };
    }

    const years = new Set();
    const months = {};
    const dates = new Set();

    availableData.forEach(item => {
      const date = new Date(item.created_at);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const dateStr = date.toISOString().split('T')[0];

      years.add(year);
      dates.add(dateStr);
      
      if (!months[year]) {
        months[year] = new Set();
      }
      months[year].add(month);
    });

    return {
      availableYears: Array.from(years).sort((a, b) => b - a),
      availableMonths: Object.fromEntries(
        Object.entries(months).map(([year, monthSet]) => [
          year,
          Array.from(monthSet).sort((a, b) => a - b)
        ])
      ),
      availableDates: dates
    };
  }, [availableData]);

  // Inicializar con valores por defecto
  useEffect(() => {
    if (availableYears.length > 0 && !selectedYear) {
      setSelectedYear(availableYears[0].toString());
    }
  }, [availableYears, selectedYear]);

  useEffect(() => {
    if (selectedYear && availableMonths[selectedYear]?.length > 0 && !selectedMonth) {
      setSelectedMonth(availableMonths[selectedYear][0].toString());
    }
  }, [selectedYear, availableMonths, selectedMonth]);

  if (!isOpen) return null;

  const handleGenerate = () => {
    if (selectedOption === 'day' && selectedDate) {
      onGenerate({ type: 'day', date: selectedDate });
    } else if (selectedOption === 'month' && selectedMonth && selectedYear) {
      onGenerate({ type: 'month', month: parseInt(selectedMonth), year: parseInt(selectedYear) });
    }
  };

  const isDateAvailable = (dateStr) => {
    return availableDates.has(dateStr);
  };

  const getTransactionCount = (dateStr) => {
    if (!availableData) return 0;
    return availableData.filter(item => {
      const itemDate = new Date(item.created_at).toISOString().split('T')[0];
      return itemDate === dateStr;
    }).length;
  };

  const getMonthTransactionCount = (year, month) => {
    if (!availableData) return 0;
    return availableData.filter(item => {
      const date = new Date(item.created_at);
      return date.getFullYear() === year && date.getMonth() + 1 === month;
    }).length;
  };

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const canGenerate = selectedOption === 'day' ? selectedDate : (selectedMonth && selectedYear);

  return (
    <div className="report-modal-overlay" onClick={onClose}>
      <div className="report-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="report-modal-header">
          <div className="header-left">
            <div className="header-icon">
              <FileText size={28} />
            </div>
            <div>
              <h2 className="header-title">Generar Reporte de Caja</h2>
              <p className="header-subtitle">Selecciona el período del reporte</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="report-modal-body">
          {availableData && availableData.length === 0 ? (
            <div className="empty-state-report">
              <AlertCircle size={48} strokeWidth={1.5} />
              <p>No hay datos disponibles</p>
              <small>No se encontraron transacciones en el sistema</small>
            </div>
          ) : (
            <>
              {/* Opciones de reporte */}
              <div className="report-options">
                <button
                  className={`option-btn ${selectedOption === 'day' ? 'active' : ''}`}
                  onClick={() => setSelectedOption('day')}
                >
                  <Calendar size={20} />
                  <div>
                    <span className="option-title">Por Día</span>
                    <span className="option-desc">Reporte de un día específico</span>
                  </div>
                </button>
                <button
                  className={`option-btn ${selectedOption === 'month' ? 'active' : ''}`}
                  onClick={() => setSelectedOption('month')}
                >
                  <TrendingUp size={20} />
                  <div>
                    <span className="option-title">Por Mes</span>
                    <span className="option-desc">Reporte mensual completo</span>
                  </div>
                </button>
              </div>

              {/* Selector de fecha */}
              {selectedOption === 'day' && (
                <div className="date-selector">
                  <label htmlFor="date-input">Selecciona una fecha</label>
                  <input
                    id="date-input"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="date-input"
                    max={new Date().toISOString().split('T')[0]}
                  />
                  {selectedDate && isDateAvailable(selectedDate) && (
                    <div className="date-info">
                      <span className="info-badge success">
                        ✓ {getTransactionCount(selectedDate)} transacciones encontradas
                      </span>
                    </div>
                  )}
                  {selectedDate && !isDateAvailable(selectedDate) && (
                    <div className="date-info">
                      <span className="info-badge warning">
                        ⚠ No hay transacciones en esta fecha
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Selector de mes */}
              {selectedOption === 'month' && (
                <div className="month-selector">
                  <div className="month-year-grid">
                    <div className="form-group">
                      <label htmlFor="year-select">Año</label>
                      <select
                        id="year-select"
                        value={selectedYear}
                        onChange={(e) => {
                          setSelectedYear(e.target.value);
                          setSelectedMonth('');
                        }}
                        className="select-input"
                      >
                        <option value="">Selecciona un año</option>
                        {availableYears.map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="month-select">Mes</label>
                      <select
                        id="month-select"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="select-input"
                        disabled={!selectedYear}
                      >
                        <option value="">Selecciona un mes</option>
                        {selectedYear && availableMonths[selectedYear]?.map(month => (
                          <option key={month} value={month}>
                            {monthNames[month - 1]}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {selectedMonth && selectedYear && (
                    <div className="date-info">
                      <span className="info-badge success">
                        ✓ {getMonthTransactionCount(parseInt(selectedYear), parseInt(selectedMonth))} transacciones en {monthNames[parseInt(selectedMonth) - 1]} {selectedYear}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="report-modal-footer">
          <button className="btn-cancel" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="btn-generate"
            onClick={handleGenerate}
            disabled={!canGenerate || (selectedOption === 'day' && selectedDate && !isDateAvailable(selectedDate))}
          >
            <Download size={18} />
            Generar Reporte
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportDateModal;
