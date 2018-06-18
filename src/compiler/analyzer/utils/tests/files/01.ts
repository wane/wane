class TestClass01 {

  p1 = 1
  p2 = 2
  p3 = 3

  m1 () {
    this.m2()
    this.p1 = 1
  }

  m2 () {
    this.m3()
    this.p2 = 2
  }

  m3 () {
    this.p3 = 3
  }

}

// Direct recursion.
class TestClass02 {

  m1 () {
    this.m1()
  }

}

// Indirect recursion
class TestClass03 {

  m1 () {
    this.m2()
  }

  m2 () {
    this.m3()
  }

  m3 () {
    this.m1()
  }

}

// With a condition
class TestClass04 {

  constructor (private cond: boolean) {
  }

  m1 () {
    if (this.cond) {
      this.m2()
    } else {
      this.m3()
    }
  }

  m2 () {
    console.log('m2')
  }

  m3 () {
    console.log('m3')
  }

}

// Calling a function
function f1 () {
}

class TestClass05 {
  m1 () {
    f1()
  }
}

// A random more complex case

class TestClass06 {

  p1 = 1
  p2 = 2
  p3 = 3

  m1 () {
    this.m2()
    this.m5()
  }

  m2 () {
    this.m6()
    this.m3()
    this.m4()
    this.p1 = 1
  }

  m3 () {
    this.p3 = 1
  }

  m4 () {
    this.m3()
  }

  m5 () {
    this.m6()
  }

  m6 () {
    this.m2()
  }

}

/**
 * Testing what does "updating" a prop mean
 */

let foo = 1

class TestClass07 {

  p = 1
  p1 = 1
  p2 = 2
  p3 = 3
  p4 = 4
  p5 = 5
  p6 = 6

  mNada () {
  }

  m1 () {
    this.p = 1 // yes
  }

  m2 () {
    foo = 2 // no
  }

  m3 () {
    foo++ // no
  }

  m4 () {
    // all yes
    this.p1++
    this.p2++
    ++this.p3
    ++this.p4
  }

  // m5 () {
  //   this.p1 = this.p2 = 1 // yes, both
  // }

  m6 () {
    this.mNada() // nope
  }

  m7 () {
    // nope, none
    this.p1 > this.p2
    this.p3 <= this.p4
    this.p5 == this.p6
  }

  // m8 () {
  //   if (this.p1 = this.p2) {
  //   }
  // }
  //
  // m9 () {
  //   if (this.p1 = this.p2 = this.p3 = this.p4) {
  //   }
  // }
  //
  // m10 () {
  //   this.p1 < (this.p2 = this.p3)
  // }

}
