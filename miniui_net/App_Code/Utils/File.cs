using System;
using System.IO;

namespace Test
{
    public class File
    {
        public File()
        {
            //
            //TODO: 在此处添加构造函数逻辑
            //
        }
        public static string Read(string path)
        {
            StreamReader sr = new StreamReader(path, System.Text.Encoding.Default);
            string text = sr.ReadToEnd();
            sr.Close();
            return text;
        }
        public static void Write(string path, string text)
        {
            StreamWriter sr = new StreamWriter(path, false, System.Text.Encoding.Default);
            sr.Write(text);
            sr.Close();
        }
    }
}