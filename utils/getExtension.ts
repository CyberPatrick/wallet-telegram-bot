export default function getExtension(file_name: string): string {
    let separated = file_name.split(".");
    if (separated.length) {
        return separated[separated.length - 1];
    }
}