import { char, scoot, left, heavy, right, down, up, light } from './characters'
import { centerWithTrunc, repeat, joinStringBlocks, insertBetween } from './utils'


export class Table {

  private width = 5
  private headings: Array<any> = []
  private rows: Array<Array<any>> = []

  private widths: number[] = []

  public setHeadings (headings: Array<any>) {
    this.headings = headings
  }

  public addRow (row: any[]) {
    this.rows.push(row)

    const missingWidthsCount = row.length - this.widths.length
    for (let i = 0; i < missingWidthsCount; i++) {
      this.widths.push(0)
    }

    this.widths.forEach((width, index) => this.widths[index] = Math.max(row[index].toString().length, width))
  }

  public toString (): string {
    return [
      this.printHeader(),
      ...this.rows.map(item => this.printDataRow(item)),
      this.printFooter(),
    ].join('\n')
  }

  private printHeader (): string {
    const leftBlock = [
      char(heavy, left(scoot), up(scoot)),
      char(heavy, left(scoot), right(scoot)),
      char(heavy, left(scoot)),
    ].join('\n')

    const middleBlock = [
      char(scoot, left(heavy), right(heavy), down(light)),
      char(scoot, up(light), down(light)),
      char(scoot, up(light), left(heavy), right(heavy)),
    ].join('\n')

    const rightBlock = [
      char(heavy, right(scoot), up(scoot)),
      char(heavy, left(scoot), right(scoot)),
      char(heavy, right(scoot)),
    ].join('\n')

    const blocks: string[] = []
    blocks.push(leftBlock)

    let isFirst = true
    for (const heading of this.headings) {
      if (isFirst) isFirst = false
      else blocks.push(middleBlock)
      blocks.push(this.printHeaderCell(heading))
    }

    blocks.push(rightBlock)
    return blocks.reduce(joinStringBlocks)
  }

  private printDataRow (data: any[]): string {
    const heavyVerticalLine = char(scoot, up(heavy), down(heavy))
    return [
      heavyVerticalLine,
      ...insertBetween(
        data.map(item => centerWithTrunc(this.width, item.toString())),
        ' ',
      ),
      heavyVerticalLine,
    ].join('')
  }

  private printFooter (): string {
    const LEFT = char(scoot, up(heavy), right(heavy))
    const LINE = char(scoot, left(heavy), right(heavy))
    const RIGHT = char(scoot, up(heavy), left(heavy))
    return [LEFT, repeat(this.widths.length * (this.width + 1) - 1, LINE), RIGHT].join('')
  }

  private printHeaderCell (header: any): string {
    const middleRow = centerWithTrunc(this.width, header.toString())
    const topBottomRow = repeat(middleRow.length, char(scoot, left(heavy), right(heavy)))
    return [topBottomRow, middleRow, topBottomRow].join('\n')
  }

}
