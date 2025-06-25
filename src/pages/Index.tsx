
import { useState } from "react";
import { Plus, Package, TrendingUp, ShoppingCart, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Sidebar from "@/components/Sidebar";
import ProductCard from "@/components/ProductCard";
import ProductForm from "@/components/ProductForm";
import { Product } from "@/types/product";

const Index = () => {
  const [products, setProducts] = useState<Product[]>([
    {
      id: "1",
      name: "Producto de Ejemplo",
      description: "Este es un producto de ejemplo para mostrar la funcionalidad",
      price: 29.99,
      category: "Electrónicos",
      stock: 50,
      image: "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=400&h=300&fit=crop",
      status: "active"
    }
  ]);
  
  const [currentView, setCurrentView] = useState<"dashboard" | "products" | "create">("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateProduct = (productData: Omit<Product, "id">) => {
    const newProduct: Product = {
      ...productData,
      id: Date.now().toString()
    };
    setProducts([...products, newProduct]);
    setCurrentView("products");
  };

  const handleEditProduct = (productData: Omit<Product, "id">) => {
    if (editingProduct) {
      setProducts(products.map(p => 
        p.id === editingProduct.id 
          ? { ...productData, id: editingProduct.id }
          : p
      ));
      setEditingProduct(null);
      setCurrentView("products");
    }
  };

  const handleDeleteProduct = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
  };

  const startEditProduct = (product: Product) => {
    setEditingProduct(product);
    setCurrentView("create");
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Dashboard de Productos
          </h1>
          <p className="text-muted-foreground">Gestiona tu inventario de manera eficiente</p>
        </div>
        <Button 
          onClick={() => setCurrentView("create")}
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Producto
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">{products.length}</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">
              {products.reduce((total, product) => total + product.stock, 0)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Inventario</CardTitle>
            <ShoppingCart className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700">
              ${products.reduce((total, product) => total + (product.price * product.stock), 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100 hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categorías</CardTitle>
            <Users className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700">
              {new Set(products.map(p => p.category)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Productos Recientes</CardTitle>
          <CardDescription>Los productos agregados recientemente</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.slice(0, 3).map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onEdit={startEditProduct}
                onDelete={handleDeleteProduct}
              />
            ))}
            {products.length === 0 && (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                No hay productos aún. ¡Crea tu primer producto!
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderProducts = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Productos</h1>
          <p className="text-muted-foreground">Gestiona todos tus productos</p>
        </div>
        <Button 
          onClick={() => setCurrentView("create")}
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Producto
        </Button>
      </div>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Input
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onEdit={startEditProduct}
                onDelete={handleDeleteProduct}
              />
            ))}
            {filteredProducts.length === 0 && (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                {searchTerm ? "No se encontraron productos" : "No hay productos aún"}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderCreateForm = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          {editingProduct ? "Editar Producto" : "Crear Nuevo Producto"}
        </h1>
        <p className="text-muted-foreground">
          {editingProduct ? "Modifica los detalles del producto" : "Añade un nuevo producto a tu inventario"}
        </p>
      </div>

      <Card className="border-0 shadow-lg">
        <CardContent className="pt-6">
          <ProductForm
            product={editingProduct}
            onSubmit={editingProduct ? handleEditProduct : handleCreateProduct}
            onCancel={() => {
              setEditingProduct(null);
              setCurrentView("products");
            }}
          />
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="flex w-full">
        <Sidebar currentView={currentView} onViewChange={setCurrentView} />
        <main className="flex-1 p-6 overflow-hidden">
          {currentView === "dashboard" && renderDashboard()}
          {currentView === "products" && renderProducts()}
          {currentView === "create" && renderCreateForm()}
        </main>
      </div>
    </div>
  );
};

export default Index;
