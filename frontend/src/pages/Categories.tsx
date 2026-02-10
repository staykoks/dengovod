import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { Plus, Trash2, Folder, Tag, ChevronRight, ChevronDown } from 'lucide-react';
import { useSettingsStore } from '../store/settingsStore';
import { translations } from '../i18n/translations';

interface Category {
    id: number;
    name: string;
    type: string;
    color: string;
    parent_id: number | null;
    is_system: boolean;
    children?: Category[];
}

const CategoryItem = ({ cat, level, onDelete, t }: {cat: Category, level: number, onDelete: (id:number)=>void, t: any}) => {
    const [open, setOpen] = useState(false);
    const hasChildren = cat.children && cat.children.length > 0;

    return (
        <div className="mb-2">
            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-100 dark:border-gray-700 flex justify-between items-center shadow-sm ml-[20px]" style={{marginLeft: `${level * 20}px`}}>
                <div className="flex items-center gap-3">
                    {hasChildren && (
                        <button onClick={() => setOpen(!open)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                            {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </button>
                    )}
                    {!hasChildren && <div className="w-4"></div>}
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{backgroundColor: cat.color}}>
                        {cat.name[0]}
                    </div>
                    <div>
                        <p className="font-bold text-gray-800 dark:text-gray-200 text-sm">{cat.name}</p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase">{cat.type === 'income' ? t.income : t.expense}</p>
                    </div>
                </div>
                {!cat.is_system && (
                    <button onClick={() => onDelete(cat.id)} className="text-gray-300 hover:text-red-500">
                        <Trash2 size={16} />
                    </button>
                )}
            </div>
            {open && hasChildren && (
                <div>
                    {cat.children?.map(child => (
                        <CategoryItem key={child.id} cat={child} level={level + 1} onDelete={onDelete} t={t} />
                    ))}
                </div>
            )}
        </div>
    )
}

const Categories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [flatCategories, setFlatCategories] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [type, setType] = useState('expense');
  const [color, setColor] = useState('#3b82f6');
  const [parentId, setParentId] = useState('');

  const { language } = useSettingsStore();
  const t = translations[language];

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories/');
      const allCats: Category[] = res.data;
      setFlatCategories(allCats);
      
      // Build Tree
      const tree: Category[] = [];
      const map = new Map<number, Category>();
      allCats.forEach(c => {
          map.set(c.id, {...c, children: []});
      });
      allCats.forEach(c => {
          if (c.parent_id) {
              map.get(c.parent_id)?.children?.push(map.get(c.id)!);
          } else {
              tree.push(map.get(c.id)!);
          }
      });
      setCategories(tree);
    } catch (error) { console.error(error); }
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/categories/', { 
          name, type, color, 
          parent_id: parentId ? parseInt(parentId) : null 
      });
      setName('');
      fetchCategories();
    } catch (error) { console.error(error); }
  };

  const handleDelete = async (id: number) => {
    if(!confirm(t.deleteCategoryConfirm)) return;
    try {
        await api.delete(`/categories/${id}`);
        fetchCategories();
    } catch (error) { alert("Cannot delete category in use or containing subcategories."); }
  }

  return (
    <div className="space-y-6">
       <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t.categories}</h2>
            <p className="text-gray-500 dark:text-gray-400">{t.organizeStructure}</p>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Create Form */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 h-fit sticky top-4">
                <h3 className="font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white"><Plus size={18}/> {t.createNew}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm text-gray-600 dark:text-gray-400">{t.name}</label>
                        <input value={name} onChange={e => setName(e.target.value)} className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-lg mt-1 dark:bg-gray-700 dark:text-white" placeholder={t.egGroceries} required />
                    </div>
                    <div>
                        <label className="text-sm text-gray-600 dark:text-gray-400">{t.type}</label>
                        <select value={type} onChange={e => setType(e.target.value)} className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-lg mt-1 dark:bg-gray-700 dark:text-white">
                            <option value="expense">{t.expense}</option>
                            <option value="income">{t.income}</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-sm text-gray-600 dark:text-gray-400">{t.parentCategory}</label>
                        <select value={parentId} onChange={e => setParentId(e.target.value)} className="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-lg mt-1 dark:bg-gray-700 dark:text-white">
                            <option value="">{t.noneRoot}</option>
                            {flatCategories.filter(c => c.type === type).map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-sm text-gray-600 dark:text-gray-400">{t.color}</label>
                        <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-full h-10 p-1 border border-gray-200 dark:border-gray-600 rounded-lg mt-1 dark:bg-gray-700" />
                    </div>
                    <button className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700">{t.addCategory}</button>
                </form>
            </div>

            {/* List */}
            <div className="md:col-span-2 space-y-4">
                <h3 className="font-bold text-gray-700 dark:text-gray-300">{t.categoryTree}</h3>
                <div className="space-y-2">
                    {categories.map(cat => (
                        <CategoryItem key={cat.id} cat={cat} level={0} onDelete={handleDelete} t={t} />
                    ))}
                </div>
            </div>
       </div>
    </div>
  );
};

export default Categories;
