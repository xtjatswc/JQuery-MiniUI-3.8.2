using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Collections;

namespace Plusoft.Utils
{
    public class DataTree
    {
        protected String idField = "id";
        protected String pidField = "pid";
        protected String nodesField = "children";

        protected String rootId = "-1";
        protected String leafField = "isLeaf";
        protected String levelField = "_level";
        protected String expandedField = "expanded";

        protected ArrayList tree = new ArrayList();     //树形数据
        protected ArrayList list = new ArrayList();     //列表数据
        protected ArrayList dataview = null;            //数据视图：折叠

        protected Hashtable idMaps = new Hashtable();

        public DataTree(String idField, String pidField, String nodesField)
        {
            this.idField = idField;
            this.pidField = pidField;
            this.nodesField = nodesField;
        }
        /// <summary>
        /// 加载列表数据
        /// </summary>
        /// <param name="list"></param>
        public void LoadList(ArrayList list)
        {
            if (list == null) list = new ArrayList();
            ArrayList tree = Tree.List2Tree(list, nodesField, idField, pidField);
            Load(tree);
        }
        /// <summary>
        /// 加载树形数据
        /// </summary>
        /// <param name="tree"></param>
        public void Load(ArrayList tree)
        {
            //节点必须有idField
            if (tree == null) tree = new ArrayList();
            list = Tree.Tree2List(tree, "-1", nodesField, idField, pidField);
            dataview = null;

            //idField存储哈希，便于快速检索
            idMaps = new Hashtable();
            for (int i = list.Count - 1; i >= 0; i--)
            {
                Hashtable node = (Hashtable)list[i];
                idMaps[node[idField].ToString()] = node;
            }

            //遍历列表，生成leafField, levelField
            for (int i = list.Count - 1; i >= 0; i--)
            {
                Hashtable node = (Hashtable)list[i];
                String id = node[idField].ToString();
                ArrayList nodes = (ArrayList)node[nodesField];
                node[leafField] = (nodes == null || nodes.Count == 0) ? true : false;
                node[levelField] = GetAncestors(id).Count;
            }

            //清除折叠信息
            _collapseNodes = new ArrayList();
            DoExpandeds();

            //清除过滤信息
            filtered = null;
        }        
        public int GetTotalCount()
        {
            return GetDataView().Count;
        }
        public ArrayList GetPagedData(int pageIndex, int pageSize)
        {
            //1)折叠后的数据视图
            ArrayList list = GetDataView();

            //2)返回分页数据
            int pages = list.Count / pageSize;
            if (pages * pageSize < list.Count) pages += 1;

            if (pageIndex > pages - 1) pageIndex = pages - 1;

            ArrayList nodes = new ArrayList();
            int start = pageIndex * pageSize;
            int end = (pageIndex + 1) * pageSize;

            for (int i = start; i < end; i++)
            {
                if (i > list.Count - 1 || i < 0) continue;
                Hashtable node = (Hashtable)list[i];
                if (node == null)
                {
                    continue;
                }
                nodes.Add(node);
            }

            return CloneNodes(nodes);            
        }

        //////////////////////////////////////////////////////////////////////////////////
        protected ArrayList _collapseNodes = new ArrayList();
        public void SetRequest(HttpRequest Request)
        {
            String s = Convert.ToString(Request["__ecconfig"]);
            if (!String.IsNullOrEmpty(s))
            {
                Hashtable config = (Hashtable)JSON.Decode(s);
                _collapseNodes = (ArrayList)config["collapseNodes"];

                if (_collapseNodes == null) _collapseNodes = new ArrayList();
            }
            DoExpandeds();
            dataview = null;
        }
        protected void DoExpandeds()
        {
            //处理expandedField
            for (int i = 0, l = list.Count; i < l; i++)
            {
                Hashtable node = (Hashtable)list[i];
                node.Remove(expandedField);
            }
            for (int i = 0, l = _collapseNodes.Count; i < l; i++)
            {
                String id = _collapseNodes[i].ToString();
                Hashtable node = GetNode(id);
                node[expandedField] = false;
            }
        }
        //////////////////////////////////////////////////////////////////////////////////
        /// <summary>
        /// 获取数据视图：过滤、折叠后
        /// </summary>
        /// <returns></returns>
        public ArrayList GetDataView()
        {
            if (dataview == null)
            {                
                //expanded
                ArrayList data = new ArrayList();
                for (int i = 0,l=list.Count; i<l; i++)
                {
                    Hashtable node = (Hashtable)list[i];
                    if (IsVisibleNode(node))
                    {
                        data.Add(node);
                    }
                }

                //filter
                if (filtered != null)
                {
                    //1)缓存过滤节点和父节点
                    Hashtable filterMaps = new Hashtable();
                    for (int i = 0, l = filtered.Count; i < l; i++)
                    {
                        Hashtable node = (Hashtable)filtered[i];
                        String id = node[idField].ToString();
                        if (filterMaps[id] == null) filterMaps[id] = node;

                        ArrayList ans = GetAncestors(id);
                        for (int j = 0, k = ans.Count; j < k; j++)
                        {
                            Hashtable pnode = (Hashtable)ans[j];
                            String pid = pnode[idField].ToString();
                            if (filterMaps[pid] == null) filterMaps[pid] = pnode;
                        }
                    }
                    //2)data删除所有不存在filterMaps中的节点
                    for (int i = data.Count - 1; i >= 0; i--)
                    {
                        Hashtable node = (Hashtable)data[i];
                        String id = node[idField].ToString();
                        if (filterMaps[id] == null)
                        {
                            data.RemoveAt(i);
                        }
                    }

                }
                                    
                dataview = data;
            }
            return dataview;
        }
        protected ArrayList filtered = null;
        /// <summary>
        /// 设置过滤后的节点数组
        /// </summary>
        /// <param name="nodes"></param>       
        public void SetFiltered(ArrayList nodes)
        {
            filtered = nodes;
            dataview = null;
        }
        //////////////////////////////////////////////////////////////////////////////////
        public ArrayList GetAncestors(String id)
        {
            ArrayList ans = new ArrayList();
            while (true)
            {
                Hashtable parentNode = GetParentNode(id);
                if (parentNode == null) break;
                ans.Add(parentNode);
                id = Convert.ToString(parentNode[pidField]);
            }
            ans.Reverse();
            return ans;
        }        
        public Hashtable GetParentNode(String pid)
        {
            return (Hashtable)idMaps[pid];
        }
        public ArrayList GetChildNodes(String id)
        {
            Hashtable node = (Hashtable)idMaps[id];
            if (node == null) return null;
            return (ArrayList)node[nodesField];
        }
        public Hashtable GetNode(String id)
        {
            return (Hashtable)idMaps[id];
        }
        protected Boolean IsVisibleNode(Hashtable node)
        {
            Hashtable parent = GetParentNode(node[pidField].ToString());
            if (parent == null) return true;
            if (parent[expandedField] == null) return IsVisibleNode(parent);
            if ((Boolean)parent[expandedField] == false) return false;
            return true;
        }
        protected ArrayList CloneNodes(ArrayList nodes)
        {
            ArrayList clone = (ArrayList)JSON.Decode(JSON.Encode(nodes));
            for (int i = 0, l = clone.Count; i < l; i++)
            {
                Hashtable node = (Hashtable)clone[i];
                node.Remove(nodesField);
            }
            return clone;
        }
    }
}