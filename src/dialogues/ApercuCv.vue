<template>
<q-dialog v-model="ui.d.ACVouvrir" persistent>
  <q-card :class="styp('sm') + 'column minh'">
    <q-toolbar class="col-auto bg-secondary text-white">
      <q-btn dense size="md" color="primary" icon="close" @click="ui.fD"/>
      <q-toolbar-title>
        <span class="titre-lg">{{estAvc ? na.nom : na.nomc}}</span> 
        <span v-if="estAvc" class="titre-md q-ml-md">[{{$t('moi')}}]</span>
      </q-toolbar-title>
      <q-btn v-if="!estGroupe && !estAvc && net" dense size="md" padding="none" round
        color="primary" icon="refresh" @click="refresh"/>
      <q-btn v-if="(estAvc || estGroupe) && !diag" dense size="md" 
        icon="edit" color="primary"
        :label="$t('editer')" @click="ovcved"/>
    </q-toolbar>
    <q-toolbar inset v-if="estAvc && diag" class="bg-yellow-5 text-bold text-black titre-md">
      {{diag}}
    </q-toolbar>

    <div class="row q-pa-xs">
      <img class="col-auto q-mr-sm photomax" :src="photo" />
      <show-html v-if="info" class="col" zoom scroll maxh="15rem" :texte="info"/>
      <div v-else class="col text-italic">{{$t('FAnoinfo')}}</div>
    </div>

    <!-- Dialogue d'édition de la carte de visite -->
    <carte-visite v-model="ui.d.CVedition" 
      :photo-init="photo" :info-init="info" :na="na"/>

  </q-card>
</q-dialog>
</template>

<script>
import { ref } from 'vue'

import stores from '../stores/stores.mjs'
import { ChargerCvs, MajCv, MajCvGr } from '../app/operations.mjs'
import { ID } from '../app/api.mjs'
import { styp, $t } from '../app/util.mjs'

import ShowHtml from '../components/ShowHtml.vue'
import CarteVisite from '../dialogues/CarteVisite.vue'

export default {
  name: 'ApercuCv',

  props: {
  },

  components: { ShowHtml, CarteVisite },

  computed: {
    lidk () { return !this.$q.dark.isActive ? 'sombre0' : 'clair0' },
    photo () { return this.cv && this.cv.photo ? this.cv.photo : this.na.defIcon },
    info () { return this.cv ? (this.cv.info || '') : '' }
  },

  data () {
    return {
    }
  },

  methods: {
    ovcved () {
      this.ui.cveditionId = this.id
      this.ui.oD('CVedition')
    },

    async refresh () {
      const x = await new ChargerCvs().run(this.id)
      if (x) cv = x
    },

    async cvok (res) {
      if (res) {
        if (this.estGroupe) {
          await new MajCvGr().run(this.agp, res.ph, res.info)
        } else {
          await new MajCv().run(this.agp, res.ph, res.info)
        }
      }
    }

  },

  setup () {
    const session = stores.session
    const ui = stores.ui
    const aSt = stores.avatar
    const gSt = stores.groupe
    const pSt = stores.people

    const agp = ref() // un avatar, un groupe ou un people

    const id = ref(ui.cveditionId)
    const na = ref()
    const cv = ref()

    const estGroupe = ID.estGroupe(id.value)
    const estAvc = ref(false)
    const estAnim = ref(false)

    const diag =ref(session.editDiag)

    function initGr () {
      const eg = gSt.egr(id.value)
      estAnim.value = eg.estAnim
      agp.value = eg.groupe
      na.value = agp.value.na
      cv.value = agp.value.cv
      if (!diag.value && !estAnim.value) diag.value = $t('FAcvgr')
    }

    function initAv() {
      agp.value = aSt.getAvatar(id.value)
      na.value = agp.value.na
      cv.value = agp.value.cv
    }

    function initPe() {
      agp.value = pSt.getPeople(id.value)
      na.value = agp.value.na
      cv.value = agp.value.cv
    }

    if (estGroupe) {
      initGr()
      gSt.$onAction(({ name, args, after }) => {
        after((result) => {
          if (name === 'setGroupe' && args[0].id === id.value) initGr()
        })
      })
    } else {
      estAvc.value = aSt.compte.estAvDuCompte(id.value)
      if (estAvc.value){
        initAv()
        aSt.$onAction(({ name, args, after }) => {
          after((result) => {
            if (name === 'setAvatar' && args[0].id === id.value) initAv()
          })
        })
      } else {
        initPe()
        pSt.$onAction(({ name, args, after }) => {
          after((result) => {
            if (name === 'setPeople' && args[0].id === id.value) initPe()
          })
        })
      }
    }

    return {
      styp, session, ui, ID, aSt, estAvc, estGroupe, id, na, cv, agp, diag,
      net: session.accesNet
    }
  }
}
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
.minh
  min-height:20rem
</style>
