<template>
  <div v-if="nb" class='row q-gutter-xs titre-md'>
    <div>{{$t('PNOauts', nb)}}</div>
    <div v-for="im in nSt.note.auts" :key="im">
      <span class="bord cursor-pointer q-px-xs">
        <span v-if="na(im)" class="cursor-pointer" @click="openCv(im)">{{na(im).nomc}}</span>
        <span v-else>#{{im}}</span>
      </span>
    </div>

    <q-dialog v-model="opencv" persistent>
      <apercu-cv :na="nax"/>
    </q-dialog>
  </div>
</template>

<script>
import { ref } from 'vue'
import stores from '../stores/stores.mjs'
import ApercuCv from '../components/ApercuCv.vue'
import { MD } from '../app/modele.mjs'

export default {
  name: 'ListeAuts',

  props: { },

  components: { ApercuCv },

  computed: {
    nb () { return this.nSt.note.auts.length }
   },

  data () {
    return {
      nax: null
    }
  },

  methods: {
    na (im) {
      const na = this.aSt.compte.naDeIdgIm(this.nSt.note.id, this.nSt.note.im)
      if (na) return na
      const m = this.gSt.getMembre(this.nSt.note.id, im)
      return m ? m.na : null
    },
    openCv (im) {
      this.nax = this.na(im)
      this.ovopencv()
    }
  },

  setup () {
    const nSt = stores.note
    const gSt = stores.groupe
    const aSt = stores.avatar

    const opencv = ref(false)
    function ovopencv () { MD.oD(opencv) }

    return {
      opencv, ovopencv, MD, nSt, gSt, aSt
    }
  }
}
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
.bord
  border: 1px solid $grey-5
  border-radius: 5px
</style>
