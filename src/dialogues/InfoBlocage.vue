<template>
  <q-card class="moyennelargeur fs-md">
    <q-card-section class="row justify-between">
      <div class="titre-lg">{{$t('IBec')}}</div>
      <q-btn dense :label="$t('jailu')" color="warning" @click="session.fermerInfoBlocage()" />
    </q-card-section>

    <q-card-section>
      <div v-if="session.blocage <= 2" class="titre-lg q-pa-xs">{{$t('IB'+session.blocage)}}</div>
      <div v-else class="titre-lg q-pa-xs text-negative bg-yellow-5">{{$t('IB'+session.blocage)}}</div>
    </q-card-section>
    <q-card-section v-if="aSt.compte">
      <ed-blocage v-if="aSt.tribu" 
        :na-tribu="aSt.tribu.na" 
        :na-compte="nacompte"
        :source="aSt.tribu"/>
      <ed-blocage v-if="compta"
        :na-tribu="aSt.tribu.na" 
        :na-compte="nacompte"
        :source="compta"/>
    </q-card-section>
  </q-card>
</template>

<script>
import stores from '../stores/stores.mjs'
import EdBlocage from '../components/EdBlocage.vue'

export default ({
  name: 'InfoBlocage',
  components: { EdBlocage },

  computed: {
    compta () { 
      const x = this.aSt.getCompta(this.aSt.compte.id) 
      return x
    },
    nacompte () { 
      const x = this.aSt.compte.naprim
      return x
    }
  },

  setup () {
    return { 
      session: stores.session,
      aSt: stores.avatar
    }
  }
})
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
</style>
