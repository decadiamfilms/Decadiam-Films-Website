import React from 'react';
import { 
  ArchiveBoxIcon as Package, 
  PencilIcon as Edit3, 
  ArrowsRightLeftIcon as ArrowRightLeft, 
  EllipsisVerticalIcon as MoreVertical,
  CheckCircleIcon as CheckCircle,
  ExclamationTriangleIcon as AlertTriangle,
  XCircleIcon as XCircle,
  MapPinIcon as MapPin
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import type { Product, ProductInventory } from '@/types/inventory';

interface StockCheckCardProps {
  product: Product;
  inventory: ProductInventory | null;
  warehouseName?: string;
  onAdjust: (product: Product) => void;
  onTransfer: (product: Product) => void;
  onViewDetails: (product: Product) => void;
  onViewMovements: (product: Product) => void;
}

const StockCheckCard: React.FC<StockCheckCardProps> = ({
  product,
  inventory,
  warehouseName,
  onAdjust,
  onTransfer,
  onViewDetails,
  onViewMovements
}) => {
  // Determine stock status
  const getStockStatus = (): 'ok' | 'low' | 'out' => {
    if (!inventory || inventory.quantity_available === 0) return 'out';
    if (inventory.quantity_available <= inventory.reorder_point) return 'low';
    return 'ok';
  };

  const stockStatus = getStockStatus();

  const StatusIcon = () => {
    switch (stockStatus) {
      case 'out':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'low':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
  };

  return (
    <div
      className={`stock-check-card status-${stockStatus}`}
      data-product-id={product.id}
    >
      {/* Product Header */}
      <div className="card-header">
        <div className="product-info">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="product-image"
            />
          ) : (
            <div className="product-image-placeholder">
              <Package className="w-6 h-6" />
            </div>
          )}
          
          <div className="product-details">
            <h3 className="product-name">{product.name}</h3>
            <p className="product-sku">{product.sku}</p>
            {product.category_name && (
              <span className="category-badge">{product.category_name}</span>
            )}
          </div>
        </div>
        
        <div className="status-indicator">
          <StatusIcon />
        </div>
      </div>

      {/* Stock Levels */}
      <div className="stock-levels">
        <div className="stock-main">
          <span className="stock-label">Available</span>
          <span className="stock-value-large">
            {inventory?.quantity_available || 0}
          </span>
        </div>
        
        <div className="stock-details">
          <div className="stock-detail-item">
            <span className="label">On Hand</span>
            <span className="value">{inventory?.quantity_on_hand || 0}</span>
          </div>
          <div className="stock-detail-item">
            <span className="label">Reserved</span>
            <span className="value">{inventory?.quantity_reserved || 0}</span>
          </div>
          <div className="stock-detail-item">
            <span className="label">Incoming</span>
            <span className="value">{inventory?.quantity_pending_in || 0}</span>
          </div>
          <div className="stock-detail-item">
            <span className="label">Reorder</span>
            <span className="value warning">{inventory?.reorder_point || 0}</span>
          </div>
        </div>
      </div>

      {/* Warehouse Info */}
      {warehouseName && (
        <div className="warehouse-info">
          <MapPin className="w-4 h-4" />
          {warehouseName}
        </div>
      )}

      {/* Actions */}
      <div className="card-actions">
        <Button
          variant="primary"
          size="sm"
          onClick={() => onAdjust(product)}
          className="flex-1"
        >
          <Edit3 className="w-4 h-4 mr-1" />
          Adjust
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onTransfer(product)}
          className="flex-1"
        >
          <ArrowRightLeft className="w-4 h-4 mr-1" />
          Transfer
        </Button>
        <div className="dropdown relative">
          <Button
            variant="outline"
            size="sm"
            className="w-10 p-0 dropdown-trigger"
          >
            <MoreVertical className="w-4 h-4" />
          </Button>
          <div className="dropdown-menu absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-lg p-2 min-w-[160px] z-10 hidden">
            <button
              onClick={() => onViewDetails(product)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded"
            >
              View Details
            </button>
            <button
              onClick={() => onViewMovements(product)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded"
            >
              Stock History
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockCheckCard;