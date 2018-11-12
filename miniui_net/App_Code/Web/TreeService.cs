using System;
using System.Collections.Generic;
using System.Web;

using System.Collections;
using System.Reflection;
using Plusoft.Utils;
using Plusoft.BLL;
using Plusoft.DBUtility;

namespace Plusoft.Web
{
    public class TreeService : BaseService
    {
        public TreeService(HttpRequest Request, HttpResponse Response)
            : base(Request, Response)
        {
        }

        public void LoadTree()
        {
            String sql = "select * from plus_file order by num, updatedate";
            ArrayList folders = new DataBase().Select(sql);
            String json = JSON.Encode(folders);
            Response.Write(json);
        }



        public void LoadNodes2()
        {

            String json1 = Request["data"];

            String id = JSON.Decode(json1).ToString();

            if (String.IsNullOrEmpty(id)) id = "-1";

            //获取下一级节点
            String sql = "select * from plus_file where pid = '" + id + "' order by num, updatedate";
            ArrayList folders = new DataBase().Select(sql);

            //判断节点，是否有子节点。如果有，则处理isLeaf和expanded。
            for (int i = 0, l = folders.Count; i < l; i++)
            {
                Hashtable node = (Hashtable)folders[i];
                String nodeId = node["id"].ToString();

                String sql2 = "select * from plus_file where pid = '" + nodeId + "' order by num, updatedate";
                ArrayList nodes = new DataBase().Select(sql2);

                if (nodes.Count > 0)
                {
                    node["isLeaf"] = false;
                    node["expanded"] = false;
                    node["asyncLoad"] = false;
                }

            }

            //返回JSON
            String json = JSON.Encode(folders);
            Response.Write(json);
        }

        public void LoadNodes()
        {

            String id = Request["id"];
            if (String.IsNullOrEmpty(id)) id = "-1";

            //获取下一级节点
            String sql = "select * from plus_file where pid = '" + id + "' order by num, updatedate";
            ArrayList folders = new DataBase().Select(sql);

            //判断节点，是否有子节点。如果有，则处理isLeaf和expanded。
            for (int i = 0, l = folders.Count; i < l; i++)
            {
                Hashtable node = (Hashtable)folders[i];
                String nodeId = node["id"].ToString();

                String sql2 = "select * from plus_file where pid = '" + nodeId + "' order by num, updatedate";
                ArrayList nodes = new DataBase().Select(sql2);

                if (nodes.Count > 0)
                {
                    node["isLeaf"] = false;
                    node["expanded"] = false;
                }

            }

            //返回JSON
            String json = JSON.Encode(folders);
            Response.Write(json);
        }
        public void SaveTree()
        {
            String dataJSON = Request["data"];
            String removedJSON = Request["removed"];
            ArrayList tree = (ArrayList)JSON.Decode(dataJSON);
            ArrayList removed = (ArrayList)JSON.Decode(removedJSON);

            //生成节点列表
            ArrayList list = Tree.Tree2List(tree, "-1", "children", "id", "pid");

            //生成id和num
            for (int i = 0, l = list.Count; i < l; i++)
            {
                Hashtable node = (Hashtable)list[i];
                node["num"] = i;
                if (node["id"] == null || node["id"].ToString() == "")
                {
                    node["id"] = Guid.NewGuid().ToString();
                }

            }

            //生成pid
            list = Tree.Tree2List(tree, "-1", "children", "id", "pid");

            // Add/Update/Move Node
            for (int i = 0, l = list.Count; i < l; i++)
            {
                Hashtable node = (Hashtable)list[i];

                String state = node["_state"] != null ? node["_state"].ToString() : "";
                if (state == "added")
                {
                    node["createtime"] = DateTime.Now;
                    new AppService().AddFile(node);
                }
                else
                {
                    new AppService().UpdateFile(node);
                }
            }
            // Remove Node
            if (removed != null)
            {
                for (int j = 0, len = removed.Count; j < len; j++)
                {
                    Hashtable node = (Hashtable)removed[j];
                    String id = node["id"].ToString();
                    new AppService().RemoveFile(id);
                }
            }
        }


        public void FilterTree()
        {
            //获取查询参数
            String text = Request["name"].ToString().ToLower();

            //获取整个树数据
            String sql = "select * from plus_file order by num, updatedate";
            ArrayList nodes = new DataBase().Select(sql);

            //找出符合查询条件的节点
            ArrayList data = new ArrayList();
            for (int i = 0, l = nodes.Count; i < l; i++)
            {
                Hashtable node = (Hashtable)nodes[i];
                string name = node["name"] != null ? node["name"].ToString().ToLower() : "";
                if (name.IndexOf(text) > -1)
                {
                    data.Add(node);

                    //加入父级所有节点
                    String pid = node["pid"].ToString();
                    if (pid != "-1")
                    {
                        ArrayList data2 = SearchParentNode(pid, nodes);
                        data.AddRange(data2);
                    }
                }
            }

            //记录哈希
            Hashtable idMaps = new Hashtable();
            for (int i = 0, l = data.Count; i < l; i++)
            {
                Hashtable node = (Hashtable)data[i];
                String id = node["id"].ToString();
                if (idMaps[id] == null)
                {
                    idMaps[id] = node;
                }
            }

            //重新生成
            data = new ArrayList();
            for (int i = 0, l = nodes.Count; i < l; i++)
            {
                Hashtable node = (Hashtable)nodes[i];
                String id = node["id"].ToString();
                if (idMaps[id] != null)
                {
                    data.Add(node);
                }
            }

            //返回JSON
            String dataJson = JSON.Encode(data);
            Response.Write(dataJson);
        }

        private ArrayList SearchParentNode(string pid, ArrayList nodes)
        {
            ArrayList data = new ArrayList();
            for (int i = 0; i < nodes.Count; i++)
            {
                Hashtable node = (Hashtable)nodes[i];
                if (node["id"].ToString() == pid)
                {
                    data.Add(node);
                    if (node["pid"].ToString() != "-1")
                    {
                        ArrayList data2 = SearchParentNode(node["pid"].ToString(), nodes);
                        data.AddRange(data2);
                    }
                }
            }
            return data;
        }
    }
}