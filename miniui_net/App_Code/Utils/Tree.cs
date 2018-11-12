using System;
using System.Collections;

namespace Plusoft.Utils
{
    public class Tree
    {
        public static ArrayList List2Tree(ArrayList table, string childrenField, string idField, string parentIdField)
        {
            ArrayList tree = new ArrayList();
            //建立快速索引
            Hashtable hash = new Hashtable();
            for (int i = 0, l = table.Count; i < l; i++)
            {
                Hashtable t = (Hashtable)table[i];
                hash[t[idField]] = t;
            }
            //数组转树形        
            for (int i = 0, l = table.Count; i < l; i++)
            {
                Hashtable t = (Hashtable)table[i];
                object parentID = t[parentIdField];
                if (parentID == null || parentID.ToString() == "-1")   //如果没有父节点, 是第一层
                {
                    tree.Add(t);

                    continue;
                }
                Hashtable parent = (Hashtable)hash[parentID];
                if (parent == null)     //如果没有父节点, 是第一层
                {
                    tree.Add(t);
                    continue;
                }
                ArrayList children = (ArrayList)parent[childrenField];
                if (children == null)
                {
                    children = new ArrayList();
                    parent[childrenField] = children;
                }
                children.Add(t);
            }

            //创建树形后, 遍历树形, 生成OuterLineNumber体现树形结构
            //SyncTreeNodes(tree, 1, "", childrenField);

            return tree;
        }
        /*private static void SyncTreeNodes(ArrayList nodes, int outlineLevel, String outlineNumber, string childrenField)
        {

            for (int i = 0, l = nodes.Count; i < l; i++)
            {
                Hashtable node = nodes[i] as Hashtable;

                node["OutlineLevel"] = outlineLevel;
                node["OutlineNumber"] = outlineNumber + (i + 1);

                ArrayList childNodes = (ArrayList)node[childrenField];

                if (childNodes != null && childNodes.Count > 0)
                {
                    SyncTreeNodes(childNodes, outlineLevel + 1, node["OutlineNumber"].ToString() + ".", childrenField);
                }
            }
        }*/

        public static ArrayList Tree2List(ArrayList tree, string parentId, string childrenField, string idField, string parentIdField)
        {
            ArrayList list = new ArrayList();
            for (int i = 0, len = tree.Count; i < len; i++)
            {
                Hashtable task = (Hashtable)tree[i];

                task[parentIdField] = parentId;

                list.Add(task);

                ArrayList children = (ArrayList)task[childrenField];

                if (children != null && children.Count > 0)
                {
                    String id = task[idField] == null ? "" : task[idField].ToString();
                    ArrayList list2 = Tree2List(children, id, childrenField, idField, parentIdField);
                    list.AddRange(list2);
                }
                //task.Remove(childrenField);
            }
            return list;
        }
    }
}