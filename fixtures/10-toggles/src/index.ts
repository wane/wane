// @ts-ignore
@component({
  template: `
    <div>
      <w-block [w-if]="isFirstOn">
        First switch is on.    
      </w-block>    
      <w-block [w-if]="!isFirstOn">
        First switch is off.    
      </w-block>
    </div>
    
    <div>
      <div [w-if]="isSecondOn">Second switch is on.</div>    
      <div [w-if]="!isSecondOn">Second switch is off.</div>    
    </div>
    
    <div>
      <button (click)="toggleFirst()">Toggle first</button>    
      <button (click)="toggleSecond()">Toggle second</button>    
    </div>
  `,
})
export default class {

  isFirstOn: boolean = false
  isSecondOn: boolean = false

  toggleFirst () {
    this.isFirstOn = !this.isFirstOn
  }

  toggleSecond () {
    this.isSecondOn = !this.isSecondOn
  }

}
