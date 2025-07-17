export class DataFilterUtils {
  /**
   * Removes tags that start with a given prefix from each document.
   * @param data - The array of dashboard documents.
   * @param prefix - The tag prefix to filter out.
   * @returns The cleaned array with filtered tags.
   */
  static removeTagsWithPrefix(data: any[], prefix: string): any[] {
    return data.map((doc) => {
      if (Array.isArray(doc.tags)) {
        doc.tags = doc.tags.filter((tag) => !tag.startsWith(prefix));
      }
      return doc;
    });
  }
}
