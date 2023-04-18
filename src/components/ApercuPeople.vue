<template>
  <div :class="dkli(idx)">
    <apercu-genx :na="p.na" :cv="p.cv" :idx="idx" detail-people />

    <div v-if="p.sp" :class="'fs-md ' + (p.sp === 2 ? 'text-bold' : '')">{{$t('APtr' + p.sp)}}</div>
    <div v-if="!simple && p.avch.length" class="row items-center">
      <span class="text-italic">{{$t('APch', p.avch.length)}}</span>
      <span v-for="n in p.avch" :key="n" class="q-ml-sm q-px-xs bord">{{n}}</span>
    </div>
    <div v-if="!simple && p.gr.length" class="row items-center">
      <span class="text-italic">{{$t('APgr', p.gr.length)}}</span>
      <span v-for="n in p.gr" :key="n" class="q-ml-sm q-px-xs bord">{{n}}</span>
    </div>

  </div>
</template>
<script>

import { toRef, ref, watch } from 'vue'

import stores from '../stores/stores.mjs'
import ApercuGenx from './ApercuGenx.vue'
import { getNg } from '../app/modele.mjs'

export default {
  name: 'ApercuPeople',

  props: { id: Number, idx: Number, simple: Boolean },

  components: { ApercuGenx },

  computed: { },

  data () { return {
  }},

  methods: {
    dkli (idx) { return this.$q.dark.isActive ? (idx ? 'sombre' + (idx % 2) : 'sombre0') : (idx ? 'clair' + (idx % 2) : 'clair0') },
  },

  setup (props) {
    const session = stores.session
    const pSt = stores.people
    const ui = stores.ui
    const id = toRef(props, 'id')
    
    function getP () {
      const p = pSt.getPeople(id.value)
      p.avch = []
      p.chats.forEach((val, id) => { p.avch.push(getNg(id).nom) })
      p.avch.sort((a,b) => { a < b ? -1 : (a > b ? 1 : 0)})
      p.gr = []
      p.groupes.forEach((val, idg) => { p.gr.push(getNg(idg).nom) })
      p.gr.sort((a,b) => { a < b ? -1 : (a > b ? 1 : 0)})
      return p
    }

    const p = ref(getP())

    /* Nécessaire pour tracker le changement d'id
    Dans une liste le composant N'EST PAS rechargé quand la liste change */
    watch(() => id.value, (ap, av) => {
        p.value = getP()
      }
    )

    pSt.$onAction(({ name, args, after }) => {
      after((result) => {
        if (name === 'getElt' && args[0].id === id.value) {
          p.value = getP()
        }
      })
    })

    return {
      session,
      p,
      ui
    }
  }
}
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
</style>
